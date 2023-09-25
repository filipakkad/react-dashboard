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
    withDbConnection(function(con) {
      DBI::dbListTables(con)
    })
  })
}

#* @post /api/data
#* @options /api/data
#* @param req JSON containing filenames
#* @serializer unboxedJSON
function(req) {
  future_promise({
    withDbConnection(function(con) {
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
    })
  })
}


#* @post /api/download
function(req, res) {

    table <- req$args$params$table
    filters <- req$args$params$filters
    filename <- file.path(tempdir(), glue::glue("{table}.csv"))


  future_promise({
    withDbConnection(function(con) {
      dt <- tbl(con, table)
      query <- buildQuery(dt, filters)
      query$unpaginated_tbl %>% collect()
    })
  }) %...>% (function(dt) {
      write.csv(dt, filename, row.names = FALSE)
      include_file(filename, res, "text/csv")
    })
}


