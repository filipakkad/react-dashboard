library(plumber)

pool <- pool::dbPool(RSQLite::SQLite(), path = ":dbname:")

root <- pr("plumber.R")
root %>%
  pr_hook("exit", function() {
    print("Closing connection")
    pool::poolClose(pool)
  }) %>%
  pr_run(port = 3232)


