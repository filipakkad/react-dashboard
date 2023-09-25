library(plumber)

root <- pr("plumber.R")
root %>%
  pr_run(port = 3232)


