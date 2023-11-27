library(plumber)
library(keyring)
library(reticulate)
wc <- reticulate::import("databricks.sdk")
wc_auth <- reticulate::import("databricks.sdk.oauth")
wc_sql <- reticulate::import("databricks.sdk.service.sql")


oauth_client <- wc_auth$OAuthClient(
  host=Sys.getenv('HOST'),
  client_id=Sys.getenv('CLIENT_ID'),
  client_secret=Sys.getenv('CLIENT_SECRET'),
  redirect_url=Sys.getenv('CALLBACK_URL'),
  scopes=c("all-apis", "sql", "offline_access", "openid")
)


redirect_and_sign_in <- function(req, res, oauth_client) {
  print("AUTHENTICATION")
  consent <- oauth_client$initiate_consent()
  consent_dict <- consent$as_dict()
  req$session$consent <- consent_dict
  # Set the HTTP status code for redirection (302 Found)
  res$status <- 302
  res$setHeader("Location", consent$auth_url)
  ""
}

root <- pr("plumber.R")
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
  pr_run(port = 3000)

