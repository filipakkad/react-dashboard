buildQuery <- function(tableName, filters, page = NULL, page_size = NULL, con, columns = NULL) {
  dt <- tbl(con, tableName)
  purrr::pwalk(filters, function(...) {
    args <- list(...)
    columnId <- args$columnId
    filterOption <- args$filterOption
    filterValue <- args$filterValue

    if(columnId %in% names(dt) && length(filterValue) > 0) {
      if(filterOption == "notContainsExactly") {
        dt <<- dt %>% dplyr::filter(!(!!sym(columnId) %in% filterValue))
      } else if(filterOption == "containsExactly") {
        dt <<- dt %>% dplyr::filter((!!sym(columnId) %in% filterValue))
      }
    }
  })


  narrowedDt <- dt
  if(!is.null(columns) && length(columns) > 0 && all(columns %in% names(dt))) {
    narrowedDt <- dt %>% select(any_of(columns))
  }

  paginated_dt <- sql_render(narrowedDt)
  if(!is.null(page) && !is.null(page_size)) {
    paginated_dt <- glue::glue("SELECT * FROM ({paginated_dt}) LIMIT {page_size} OFFSET {(page - 1) * page_size};")
  }
  return(list(
    paginated_dt=paginated_dt,
    unpaginated_tbl=sql_render(narrowedDt),
    totalCount=dt %>% summarise(n = n()) %>% pull(n),
    columns = purrr::map(names(dt), function(name) {
      list(
        id = name,
        name = name,
        isSelected = name %in% names(narrowedDt)
      )
    })
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
