# Load the required packages
library(plumber)
library(purrr)
library(dplyr)
library(dbplyr)
library(DBI)
library(purrr)
library(future)
library(promises)
future::plan("multisession", workers = 2) # a worker for each core

source("./R/helpers.R")

copy_to(pool, mtcars, "mtcars",
        temporary = FALSE,
)

copy_to(pool, iris, "iris",
        temporary = FALSE,
)

#* @filter cors
cors <- function(req, res) {
  res$setHeader("Access-Control-Allow-Origin", "*")

  if (req$REQUEST_METHOD == "OPTIONS") {
    res$setHeader("Access-Control-Allow-Methods","*")
    res$setHeader("Access-Control-Allow-Headers", req$HTTP_ACCESS_CONTROL_REQUEST_HEADERS)
    res$status <- 200
    return(list())
  } else {
    plumber::forward()
  }
}

#* @assets ./frontend/dist /
list()

#* @get api/list-tables
function() {
  future_promise({
    con <- pool::localCheckout(pool)
    DBI::dbListTables(con)
  }, globals = list(pool = pool))
}

#* @post /api/data
#* @options /api/data
#* @param req JSON containing filenames
#* @serializer unboxedJSON
function(req) {
  future_promise({
    con <- pool::localCheckout(pool)
    table <- req$args$table
    filters <- req$args$filters
    page <- as.integer(req$args$page)
    per_page <- as.integer(req$args$perPage)

    if (is.na(page) || is.na(per_page) || page <= 0 || per_page <= 0) {
      res$status <- 400
      return(list(error = "Invalid parameters. Please provide valid page and per_page values."))
    }

    # Calculate the offset and limit for pagination

    dt <- tbl(con, table)
    queries <- buildQuery(dt, filters, page, per_page)

    result = list(
      data = queries$paginated_dt %>% collect(),
      count = (queries$unpaginated_tbl %>% summarise(n = n()) %>% pull(n)),
      columns = names(dt) %>% purrr::map(function(name) {
        list(
          id = name,
          name = name
        )
      })
    )

    result
  }, globals = list(pool = pool, req = req, tbl = tbl))
}


#* @post /api/download
function(req, res) {
  future_promise({
    con <- pool::localCheckout(pool)
    table <- req$args$params$table
    filters <- req$args$params$filters
    filename <- file.path(tempdir(), glue::glue("{table}.csv"))

    dt <- tbl(con, table)
    query <- buildQuery(dt, filters)

    write.csv(query$unpaginated_tbl %>% collect(), filename, row.names = FALSE)
    include_file(filename, res, "text/csv")
  }, globals = list(pool = pool, req = req, res = res))
}


