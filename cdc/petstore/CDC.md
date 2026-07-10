# Swagger Petstore - OpenAPI 3.0 — CDC (Code-Call Descriptor)

Base URL: /api/v3
## How to call this API (CDC pattern)

Write ONE Node.js (18+) script per question. Rules:
1. Send header `api_key: $CDC_PETSTORE_TOKEN` (read from env, never hardcode).
2. Fetch only what you need; paginate with per_page/page params where offered.
3. Do ALL filtering/aggregation/arithmetic IN THE SCRIPT — never in your head.
4. Print ONLY the final answer to stdout. Raw API payloads must never be
   echoed, logged, or pasted into the conversation.
5. On HTTP errors, print status + first 200 chars of the body and stop.

Query params: `*` = required. Response shapes show top-level fields only.

## pet
POST /pet body:{id,name,category,photoUrls,tags,status} -> {id,name,category,photoUrls,tags,status} — Add a new pet to the store.
PUT /pet body:{id,name,category,photoUrls,tags,status} -> {id,name,category,photoUrls,tags,status} — Update an existing pet.
GET /pet/findByStatus?status* -> [{id,name,category,photoUrls,tags,status}] — Finds Pets by status.
GET /pet/findByTags?tags* -> [{id,name,category,photoUrls,tags,status}] — Finds Pets by tags.
GET /pet/{petId} -> {id,name,category,photoUrls,tags,status} — Find pet by ID.
POST /pet/{petId}?name&status -> {id,name,category,photoUrls,tags,status} — Updates a pet in the store with form data.
DELETE /pet/{petId} -> ok — Deletes a pet.
POST /pet/{petId}/uploadImage?additionalMetadata -> {code,type,message} — Uploads an image.

## store
GET /store/inventory -> object — Returns pet inventories by status.
POST /store/order body:{id,petId,quantity,shipDate,status,complete} -> {id,petId,quantity,shipDate,status,complete} — Place an order for a pet.
GET /store/order/{orderId} -> {id,petId,quantity,shipDate,status,complete} — Find purchase order by ID.
DELETE /store/order/{orderId} -> ok — Delete purchase order by identifier.

## user
POST /user body:{id,username,firstName,lastName,email,password,phone,userStatus} -> {id,username,firstName,lastName,email,password,phone,userStatus} — Create user.
POST /user/createWithList body:[{id,username,firstName,lastName,email,password,phone,userStatus}] -> {id,username,firstName,lastName,email,password,phone,userStatus} — Creates list of users with given input array.
GET /user/login?username&password -> string — Logs user into the system.
GET /user/logout -> ok — Logs out current logged in user session.
GET /user/{username} -> {id,username,firstName,lastName,email,password,phone,userStatus} — Get user by user name.
PUT /user/{username} body:{id,username,firstName,lastName,email,password,phone,userStatus} -> ok — Update user resource.
DELETE /user/{username} -> ok — Delete user resource.
