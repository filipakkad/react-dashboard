library(plumber)
library(keyring)

source("endpoints.R")
#* @apiTitle Plumber Example API

root <- pr()
root %>%
  pr_cookie(
    key = "test",
    name = "creds",
    expiration = TRUE,
    http = TRUE,
    secure = FALSE,
    same_site = FALSE
  ) %>%
  pr_cookie(
    key = "test",
    name = "consent",
    expiration = TRUE,
    http = TRUE,
    secure = FALSE,
    same_site = FALSE
  ) %>%
  pr_static("/assets", "./frontend/dist/assets") %>%
  pr_filter("authentication", function(req, res) {
    if(is.null(req$session$creds)) {
      print("redirect")
      redirect_and_sign_in(req, res, oauth_client)
    } else {
      tryCatch({
        creds <- wc_auth$Token$from_dict(req$session$creds)
        session_credentials <- wc_auth$SessionCredentials$from_dict(oauth_client, list(token = req$session$creds))
        new_token <- session_credentials$refresh()$as_dict();
        req$session$creds <- new_token
        plumber::forward()
      }, error = function(e) {
        print("error")
        print(e)
        redirect_and_sign_in(req, res, oauth_client)
      })
    }
  }) %>%
  pr_filter("cors", function(req, res) {
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
  }) %>%
  pr_get("/callback", function(req, res) {
    code <- req$argsQuery$code
    state <- req$argsQuery$state
    consent <- wc_auth$Consent$from_dict(oauth_client, req$session$consent)
    exchanged_token <- consent$exchange_callback_parameters(list(code = code, state = state));
    req$session$creds <- exchanged_token$as_dict()$token;
    res$status <- 302
    res$setHeader("Location", "./")
    ""
  }, preempt = "authentication") %>%
  pr_get("/", html_endpoint) %>%
  pr_static("/", "./frontend/dist") %>%
  pr_get("/api/list-tables", list_tables, serializer = plumber::serializer_unboxed_json()) %>%
  pr_get("/api/user-info", user_info, serializer = plumber::serializer_unboxed_json()) %>%
  pr_post("/api/data", data_endpoint, serializer = plumber::serializer_unboxed_json()) %>%
  pr_post("/api/download", download_endpoint)

