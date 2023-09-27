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

#* @filter cors
cors <- function(req, res) {
  res$setHeader("Access-Control-Allow-Origin", "*")

  if (req$REQUEST_METHOD == "OPTIONS") {
    res$setHeader("Access-Control-Allow-Methods", "*")
    res$setHeader("Access-Control-Allow-Headers",
                  req$HTTP_ACCESS_CONTROL_REQUEST_HEADERS)
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
  withDbConnection(function(con) {
    # dbGetQuery(con, "SHOW TABLES;")$tableName
    dbListTables(con)
  })
}

#* @post /api/data
#* @options /api/data
#* @param req JSON containing filenames
#* @serializer unboxedJSON
function(req) {
  withLocalDb(function(con) {
    table <- req$args$table
    filters <- req$args$filters
    columns <- req$args$columns

    page <- as.integer(req$args$page)
    per_page <- as.integer(req$args$perPage)
    if (is.na(page) ||
        is.na(per_page) || page <= 0 || per_page <= 0) {
      res$status <- 400
      return(list(error = "Invalid parameters. Please provide valid page and per_page values."))
    }

    withDbConnection(function(serverCon) {
      localTables <- DBI::dbListTables(con)
      if (!(table %in% localTables)) {
        print("Copying")
        copy_to(con,
                tbl(serverCon, table) %>% collect(),
                table,
                temporary = FALSE)
      }
    })
    queries <- buildQuery(table, filters, page, per_page, con, columns = columns)
    collectedData <- dbGetQuery(con, queries$paginated_dt)
    result = list(
      data = collectedData,
      count = queries$totalCount,
      columns = queries$columns
    )
    result
  })

}


#* @post /api/download
function(req, res) {
  table <- req$args$params$table
  filters <- req$args$params$filters
  filename <- file.path(tempdir(), glue::glue("{table}.csv"))
  columns <- req$args$params$columns

  dt <- withLocalDb(function(con) {
    query <- buildQuery(table, filters, con = con, columns = columns)
    dbGetQuery(con, query$unpaginated_tbl)
  })

  write.csv(dt, filename, row.names = FALSE)
  include_file(filename, res, "text/csv")

}
