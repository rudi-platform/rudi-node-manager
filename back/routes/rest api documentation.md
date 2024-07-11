| Security | Group | Method | URL                                | Description                                                                        |
| -------- | ----- | ------ | ---------------------------------- | ---------------------------------------------------------------------------------- |
| public   | open  | GET    | /api/open/test                     | Test the application availability                                                  |
| public   | open  | GET    | /api/open/hash                     | Get the application git hash                                                       |
| public   | open  | GET    | /api/open/tag                      | Get the application tag                                                            |
| public   | open  | GET    | /api/open/tags                     | Get both the application git hash and tag                                          |
| public   | open  | POST   | /api/open/hash-credentials         | Get a hash for the {"usr":<login>, "pwd":<pwd>} given body                         |
|          |       |        |                                    |                                                                                    |
| public   | front | POST   | /api/front/register                | Register a new user                                                                |
| public   | front | POST   | /api/front/login                   | Login and get cookies for authorized access                                        |
| public   | front | GET    | /api/front/logout                  | Logout and delete cookies                                                          |
| jwt      | front | PUT    | /api/front/change-password         | Update the password for a user                                                     |
|          |       |        |                                    |                                                                                    |
| jwt      | front | GET    | /api/front/init-data               | Get fixed data for the UI: application tag, git hash, theme labels, form prefix    |
|          |       |        |                                    | + public URLs for RUDI Portal, RUDI node Catalog & Storage modules                 |
| jwt      | front | GET    | /api/front/node-urls               | Get form prefix + public URLs for RUDI Portal, RUDI node Catalog & Storage modules |
| jwt      | front | GET    | /api/front/form-url                | Get the console prefix                                                             |
| jwt      | front | GET    | /api/front/storage-url             | Get the RUDI node Storage public URL                                               |
| jwt      | front | GET    | /api/front/catalog-url             | Get the RUDI node Catalog public URL                                               |
| jwt      | front | GET    | /api/front/portal-url              | Get the URL of the RUDI Portal                                                     |
|          |       |        |                                    |                                                                                    |
| jwt      | data  | GET    | /api/data/uuid                     | Get a UUID v4                                                                      |
| jwt      | data  | GET    | /api/data/version                  | Get RUDI node Catalog API version                                                  |
| jwt      | data  | GET    | /api/data/licences                 | Get RUDI node Catalog licences                                                     |
| jwt      | data  | GET    | /api/data/enum                     | Get RUDI node Catalog enums                                                        |
| jwt      | data  | GET    | /api/data/enum/themes              | Get RUDI node Catalog themes                                                       |
| jwt      | data  | GET    | /api/data/enum/themes/:lang        | Get RUDI node Catalog themes for a given language                                  |
| jwt      | data  | GET    | /api/data/counts                   | Get metadata counts by status, theme, keyword & producer from RUDI node Catalog    |
| jwt      | data  | GET    | /api/data/:objectType              | Get a list of objects from RUDI node Catalog                                       |
| jwt      | data  | POST   | /api/data/:objectType              | Create a new object on RUDI node Catalog                                           |
| jwt      | data  | PUT    | /api/data/:objectType              | Create or update an object on RUDI node Catalog                                    |
| jwt      | data  | GET    | /api/data/:objectType/:id          | Get an identified object on RUDI node Catalog                                      |
| jwt      | data  | DELETE | /api/data/:objectType/:id          | Delete an identified object on RUDI node Catalog                                   |
| jwt      | data  | DELETE | /api/data/:objectType              | Delete many objects on RUDI node Catalog                                           |
|          |       |        |                                    |                                                                                    |
| jwt      | media | GET    | /api/media/jwt                     | Get RUDI node Storage token                                                        |
| jwt      | media | POST   | /api/media/media-commit            | Confirm a successful media upload to the RUDI node Storage                         |
| jwt      | media | POST   | /api/media/api-commit              | Confirm a successful media upload to the RUDI node Catalog                         |
| jwt      | media | POST   | /api/media/commit                  | Confirm a successful media upload to both RUDI node Catalog & Storage              |
| jwt      | media | GET    | /api/media/:id                     | Get the metadata for an identified media from RUDI node Catalog                    |
| jwt      | media | GET    | /api/media/download/:id            | Get the file for an identified media from RUDI node Storage                        |
|          |       |        |                                    |                                                                                    |
| jwt      | secu  | GET    | /api/secu/roles                    | Get the list of user roles for the RUDI node Manager                               |
| jwt      | secu  | GET    | /api/secu/roles/:role              | Get the description for one user role from the RUDI node Manager                   |
| jwt      | secu  | GET    | /api/secu/users                    | Get the list of users on the RUDI node Manager                                     |
| jwt      | secu  | GET    | /api/secu/users/:username          | Get the information for a user of the RUDI node Manager                            |
| jwt      | secu  | POST   | /api/secu/users                    | Creates a user on the RUDI node Manager                                            |
| jwt      | secu  | PUT    | /api/secu/users                    | Update a user's information on the RUDI node Manager                               |
| jwt      | secu  | PUT    | /api/secu/users/:id/reset-password | Reset a user's password on the RUDI node Manager                                   |
| jwt      | secu  | DELETE | /api/secu/users/:id                | Delete a user on the RUDI node Manager                                             |
