library(plumber)
library(purrr)
library(dplyr)
library(dbplyr)
library(DBI)
library(purrr)
library(future)
library(promises)
library(jose)
library(coro)
library(glue)
library(reticulate)

wc <- reticulate::import("databricks.sdk")
wc_auth <- reticulate::import("databricks.sdk.oauth")
wc_sql <- reticulate::import("databricks.sdk.service.sql")

# Set up futures
future::plan("multisession", workers = 1) # a worker for each core

# Load helper functions
source("./R/helpers.R")

# Set schema_name
schema_name <- Sys.getenv('SCHEMA_NAME')

# HTML endpoint
html_endpoint <- function(req, res) {
  include_html("./frontend/dist/index.html", res)
}

# List tables endpoint
list_tables <- async(function(req) {
  withWorkspaceClient(req, async(function(client, warehouse_id) {
    warehousese <- client$warehouses$list()
    x <- client$statement_execution$execute_statement(
      statement = glue::glue("SHOW TABLES in {schema_name}"),
      warehouse_id = warehouse_id,
      format = wc_sql$Format$JSON_ARRAY,
      wait_timeout = "30s"
    )
    purrr::map_chr(x$result$data_array, function(y) y[2])
  }))
})

# User info endpoint
user_info <- async(function(req) {
  if (!is.null(req$session$creds)) {
    jwt <- req$session$creds$access_token
    user_name <- jsonlite::fromJSON(rawToChar(base64url_decode(strsplit(jwt, ".", fixed = TRUE)[[1]][[2]])))$sub
    list(userName = user_name)
  }
})

# Data endpoint
data_endpoint <- async(function(req) {
  withWorkspaceClient(req, function(client, warehouse_id) {
    table <- req$args$table
    filters <- req$args$filters
    columns <- req$args$columns
    page <- as.integer(req$args$page)
    page_size <- as.integer(req$args$perPage)

    query <- buildQuery(schema_name, table, filters, page, page_size, columns)
    select_query <- query$select
    conditions <- query$conditions

    y <- client$statement_execution$execute_statement(
      statement = glue::glue("{select_query}"),
      warehouse_id = warehouse_id,
      wait_timeout = "30s",
      on_wait_timeout = wc_sql$ExecuteStatementRequestOnWaitTimeout$CANCEL,
      format = wc_sql$Format$JSON_ARRAY
    )
    y_count <- client$statement_execution$execute_statement(
      statement = glue::glue("SELECT COUNT(*) FROM {schema_name}.{table} {conditions} "),
      warehouse_id = warehouse_id,
      wait_timeout = "30s",
      on_wait_timeout = wc_sql$ExecuteStatementRequestOnWaitTimeout$CANCEL,
      format = wc_sql$Format$JSON_ARRAY
    )
    y_columns <- client$statement_execution$execute_statement(
      statement = glue::glue("show columns in {schema_name}.{table}"),
      warehouse_id = warehouse_id,
      wait_timeout = "30s",
      on_wait_timeout = wc_sql$ExecuteStatementRequestOnWaitTimeout$CANCEL,
      format = wc_sql$Format$JSON_ARRAY
    )

    col_names <- purrr::map_chr(y$manifest$schema$columns, function(x) x$name)

    dt <- dt_list_to_df(y$result$data_array, col_names)

    result = list(
      data = dt,
      count = as.numeric(y_count$result$data_array[[1]]),
      columns = y_columns$result$data_array %>% purrr::map(function(cl) {
        list(
          id = cl,
          name = cl,
          isSelected = cl %in% names(dt)
        )
      })
    )
    result
  })
})

# Download endpoint
download_endpoint <- async(function(req, res) {
  table <- req$args$params$table
  filters <- req$args$params$filters
  filename <- file.path(tempdir(), glue::glue("{table}.csv"))
  columns <- req$args$params$columns

  query <- buildQuery(schema_name = schema_name, table_name = table, filters = filters, columns = columns)
  select_query <- query$select
  conditions <- query$conditions

  withWorkspaceClient(req, function(client, warehouse_id) {
    y <- client$statement_execution$execute_statement(
      statement = glue::glue("{select_query}"),
      warehouse_id = warehouse_id,
      wait_timeout = "30s",
      on_wait_timeout = wc_sql$ExecuteStatementRequestOnWaitTimeout$CANCEL,
      format = wc_sql$Format$CSV,
      disposition = wc_sql$Disposition$EXTERNAL_LINKS
    )
    link <- y$result$external_links[[1]]$as_dict()$external_link
    list(link = link)
  })
})


oauth_client <- wc_auth$OAuthClient(
  host=Sys.getenv('HOST'),
  client_id=Sys.getenv('CLIENT_ID'),
  client_secret=Sys.getenv('CLIENT_SECRET'),
  redirect_url=Sys.getenv('CALLBACK_URL'),
  scopes=c("all-apis", "sql", "offline_access", "openid")
)


redirect_and_sign_in <- function(req, res, oauth_client) {
  print("AUTHENTICATION")
  consent <- oauth_client$initiate_consent()
  consent_dict <- consent$as_dict()
  req$session$consent <- consent_dict
  # Set the HTTP status code for redirection (302 Found)
  res$status <- 302
  res$setHeader("Location", consent$auth_url)
  ""
}
