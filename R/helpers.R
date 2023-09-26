buildQuery <- function(tableName, filters, page = NULL, page_size = NULL, con) {
  dt <- tbl(con, tableName)
  purrr::pwalk(filters, function(...) {
    args <- list(...)
    columnId <- args$columnId
    filterOption <- args$filterOption
    filterValue <- args$filterValue

    if(columnId %in% names(dt) && length(filterValue) > 0) {
      if(filterOption == "notContains") {
        dt <<- dt %>% dplyr::filter(!(!!sym(columnId) %like% glue::glue("%{filterValue}%")))
      } else if(filterOption == "contains") {
        dt <<- dt %>% dplyr::filter((!!sym(columnId) %like% glue::glue("%{filterValue}%")))
      }
    }
  })

  paginated_dt <- sql_render(dt)
  if(!is.null(page) && !is.null(page_size)) {
    paginated_dt <- glue::glue("SELECT * FROM ({paginated_dt}) LIMIT {page_size} OFFSET {(page - 1) * page_size};")
  }
  return(list(
    paginated_dt=paginated_dt,
    unpaginated_tbl=sql_render(dt),
    totalCount=dt %>% summarise(n = n()) %>% pull(n)
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
