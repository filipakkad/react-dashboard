buildQuery <- function(tableName, filters, page = NULL, page_size = NULL, con) {
  dt <- tbl(con, tableName)
  purrr::pwalk(filters, function(...) {
    args <- list(...)
    columnId <- args$columnId
    filterOption <- args$filterOption
    filterValue <- args$filterValue

    if(columnId %in% names(dt)) {
      if(filterOption == "notContains") {
        dt <<- dt %>% dplyr::filter(!(!!sym(columnId) %in% filterValue))
      } else if(filterOption == "contains") {
        dt <<- dt %>% dplyr::filter((!!sym(columnId) %in% filterValue))
      }
    }
  })

  paginated_dt <- dt
  if(!is.null(page) && !is.null(page_size)) {
    paginated_dt <- dt %>%
      mutate(row_num = row_number(0)) %>%
      filter(row_num > (page - 1) * page_size, row_num <= page * page_size) %>%
      select(-row_num)
  }
  return(list(
    paginated_dt=paginated_dt,
    unpaginated_tbl=dt
  ))
}

withDbConnection <- function(cb) {
  # Establish the database connection
  con <- dbConnect(RSQLite::SQLite(), "db/local_server_db.sqlite")
  result = cb(con)
  on.exit({
    dbDisconnect(con)
  })
  return(result)
}

withLocalDb <- function(cb) {
  con <- dbConnect(RSQLite::SQLite(), "db/local_db.sqlite")
  result = cb(con)
  on.exit({
    dbDisconnect(con)
  })
  return(result)
}
