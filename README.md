# Video Server Challenge

[See CodeSandBox HERE](https://codesandbox.io/s/express-ts-eyqub)

## Obejective

### Design a server that handles HTTP requests based on the following specifications:

---

- **User management** : The server should be able to register and authenticate users.

* **Room management** : The server should be able to handle creating conference rooms.
* **Interfaces defined** 
  - **UserModel** `{username:string, password:string, mobile_token:string, _id?:string, error?:boolean}` - a defined user data structure for all user objects returned by the api 
  - **RoomModel** `{name:string, limit: number, host: UserModel, participants: UserModel[], _id?:string}` - a defined room data structure for all room objects returned by api 
  - **DBResponse** `{error:boolean, message: string, data?: any}` - a defined `Express.Responser<DBResponse>` returned by all endpoints. `data?:any` can be empty, or be any `RoomModel/RoomModel[]` or `UserModel/UserModel[]` structure. 
  - **UserInput** `{username:string, password:string, mobile_token?:string}` - Expected user input for creating a user. 
  - **UserUpdateInput** `{password:string, mobile_token?:string}` - Expected user input for updating user. 
  - **RoomInput** `{name:string, limit:number,host:string, participants:string[]}` - Expected room input for creating a room. NB: host and participants `string` input are user's username.

## User management

User has: **username**, **password**, and an optional **_mobile_token_** (string)

- Get users/user API : each user will return a `DBResponse` with data as `UserModal`for one user, or `UserModal[]` for all users.
  - **All users** `/users/` `:get` for a list of all registered users, returns a data of `DBResponse` with `UserModel[]`
  - **Specific user** `/users/:username` `:get`, pass the username of the user you're looking to get info for `https://baseURL.com/users/aliziwe.demo` returns a data of `DBResponse` with `UserModel`
- Register/Delete/Update/Auth user : 
  - **Register** `/users/add` `:post` - Expects a `UserInput` structure to register a new user, and returns a `DBResponse` with a possible error and message if the username is used, else with a data structure of `UserModel`. 
  - **Auth** `/users/auth` `:post` - expects a `{ username, password }` in the body of your request, peferebly `application/json` content-type, and returns a `DBResponse` with a possible error and message if the username/password are not matched, else with a data structure of `UserModel`. Auth sessions expire after 3 minutes by default for this challange. 
  - **Update** `/users/edit` `:post` - expects a `{data: UserUpdateInput, username:string}` in the body of your request, peferebly `application/json` content-type, and returns a `DBResponse` with a possible error and message if the user is not logged in, else with a data structure of `UserModel` 
  - **Delete** `/users/delete` `:post` - expects a `{username:string}` in the body of your request, peferebly `application/json` content-type, and returns a `DBResponse` with a possible error and message if the user is not logged in, else a `DBResponse` with an `{error:false, ...}` but not `{data?:any}` field.

## Room management

Room has: name (non-unique), guid, host user, participants (users) in the room, and a capacity limit. Number of users in the room must not exceed the capacity.

- Get rooms/room/search : each user will return a `DBResponse` with data as `RoomModal`for one room, or `RoomModal[]` for all rooms whether in the search/just retrieving a list of all rooms. 
  - **All Rooms** `/rooms` `:get` - returns a data of `DBResponse` with `RoomModel[]` 
  - **Get Room** `/rooms/:guid` `:get` - pass the guid of a room you're looking to get info for `https://baseURL.com/rooms/8c3ad3.ef3exs`, returns a data of `DBResponse` with `RoomModel`. 
  - **Search** `/room/search` `:post` - expects a `{username:string}` in the body of your request, peferebly `application/json` content-type, and returns a `DBResponse` with `RoomModel[]` of all matched rooms.

- Create/Change host/JoinOrLeave Room: 
  - **Create** `/rooms/add` `:post` - Expects a `RoomInput` structure to register a new room, and returns a `DBResponse` with a data structure of `RoomModel` which is the newly created room. 
  - **Change Host** `/rooms/edit` `:post` - Expects a `{host:string, newhost:string, guid:string}` in the body of your request, peferebly `application/json` content-type, and returns a `DBResponse` with a possible error and message if the user is not logged in or `newhost/host` do not exist, else with a data structure of `RoomModel` with a new host. 
  - **JoinOrLeave** `/rooms/joinOrLeave` `:post` - Expects a `{username:string, guid:string}` in the body of your request, peferebly `application/json` content-type, and returns a `DBResponse` with a possible error and message if the user is not logged in or room is full, else with a data structure of `RoomModel` with/without the user.

# < END OF READ />
