buildQuery <- function(schema_name, table_name, filters, page = NULL, page_size = NULL, columns = NULL) {
  columns_query <- if_else(length(columns) > 0, paste0(columns, collapse=","), "*")
  conditions <- if_else(length(filters) > 0, {
    result <- purrr::pmap_chr(filters, function(...) {
      args <- list(...)
      col_id <- args$columnId
      filter_option <- args$filterOption
      filter_values <- paste0("'",args$filterValue,"'", collapse = ",")
      inOrNot = if_else(filter_option == "notContainsExactly", "NOT IN", "IN")
      glue::glue("{col_id} {inOrNot} ({filter_values})")
    }) %>% paste0(collapse = " AND ")
    glue::glue(" where {result}")
  }, "")

  pagination <- if(!is.null(page_size) && !is.null(page)) glue::glue("LIMIT {page_size} OFFSET {(page - 1) * page_size}") else ""
  list(
    select = glue::glue("SELECT {columns_query} FROM {schema_name}.{table_name} {conditions} {pagination}"),
    conditions = conditions
  )
}

withWorkspaceClient <- async(function(req, cb) {
  client <- wc$WorkspaceClient(host="https://genmab-dev.cloud.databricks.com", token=req$session$creds$access_token)
  warehouses <- client$warehouses$list()
  await(cb(client,  warehouses[[1]]$id))
})

dt_list_to_df <- function(dt_list, col_names) {
  dt <- tibble()
  purrr::map_df(dt_list, function(x) {
    x[sapply(x, is.null)] <- NA
    values <- unlist(x)
    names(values) <- col_names
    values
  })
}

