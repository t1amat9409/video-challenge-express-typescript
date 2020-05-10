import { v5 } from "uuid";
import fs from "fs-extra";

export interface DBResponse {
  error: boolean;
  message: string;
  data?: any;
}

export interface UserModel {
  _id: string;
  username: string;
  password: string;
  mobile_token: string;
  error?: boolean;
}

export interface UserInput {
  username: string;
  password: string;
  mobile_token?: string;
  _id?: string;
}

export interface UserUpdateInput {
  password: string;
  mobile_token?: string;
}

export interface UserDBIndex {
  user: User;
  at: number;
}

export class User {
  _id: string;
  username: string;
  password: string;
  mobile_token: string;
  error: boolean;

  constructor(user: UserInput) {
    this.mobile_token = user.mobile_token;
    this.password = v5(user.password, v5.DNS);
    this.username = user.username;
    this._id = user._id ? user._id : v5(this.username, v5.URL);
    this.error = false;
  }

  static init(userData: any): User {
    const u = new User(userData);
    return u;
  }

  get = (): UserModel => {
    return {
      _id: this._id,
      username: this.username,
      password: this.password,
      mobile_token: this.mobile_token
    };
  };

  update = (user: UserUpdateInput): User => {
    this.password = v5(user.password, v5.DNS);
    this.mobile_token = user.mobile_token
      ? user.mobile_token
      : this.mobile_token;
    return this;
  };
}

export interface RoomInput {
  name: string;
  host: string;
  participants: string[];
  limit: number;
  guid?: string;
}

export interface RoomDBIndex {
  room: Room;
  at: number;
}

export interface RoomModel {
  name: string;
  guid: string;
  host: UserModel;
  participants: UserModel[];
  limit: number;
}

export class Room {
  guid: string;
  name: string;
  host: User;
  participants: User[];
  limit: number;
  error?: boolean;
  constructor(room?: RoomInput, _db?: DB) {
    if (room) {
      const host = _db.getRawUser(room.host);
      if (!host.error) {
        this.host = host as User;
        this.participants = [
          ..._db
            .getRawUsers()
            //@ts-ignore
            .filter(item => room.participants.includes(item.username)),
          this.host
        ];
        this.limit = room.limit || 5;
        this.name = room.name;
        this.guid = room.guid
          ? room.guid
          : (Date.now() * Math.random()).toString(16);
      }
    }
  }

  static init = (room: RoomInput, _db: DB) => {
    const newRoom = new Room(room, _db);
    return newRoom;
  };

  get = (): RoomModel => {
    return {
      name: this.name,
      guid: this.guid,
      host: this.host.get(),
      participants: this.participants.map(item => item.get()),
      limit: this.limit
    };
  };

  update = (host: string): Room | boolean => {
    const new_host = db.getRawUser(host);
    if (!new_host.error) {
      this.host = new_host as User;

      return this;
    } else {
      return false;
    }
  };

  joinLeaveRoom = (user: User): DBResponse => {
    const inGroup = this.participants.filter(
      item => item.username === user.username
    );
    if (inGroup.length > 0) {
      this.participants = this.participants.filter(
        item => item.username !== user.username
      );
      return {
        error: false,
        message: "Room left",
        data: this.get()
      };
    } else if (this.participants.length >= this.limit) {
      return {
        error: true,
        message: "Room is already full",
        data: this.get()
      };
    } else {
      this.participants.push(user);
      return {
        error: false,
        message: "Room joined",
        data: this.get()
      };
    }
  };
}

export class DB {
  private users: User[];
  private rooms: Room[];
  private authSession: { [x: string]: number };

  constructor() {
    const data = fs.readJSONSync(__dirname + ".store.json", { flag: "r" });
    const { users = [], rooms = [], authSession = {} } = data || {
      users: [],
      rooms: [],
      authSession: {}
    };
    this.users = users.map((item: any) => {
      return User.init(item);
    });
    this.rooms = rooms.map((item: any) => {
      const _ = Room.init(item, this);
      return _;
    });
    this.authSession = authSession as { [x: string]: number };
    //console.log(data, "new DB");
  }

  public addUser = (user: UserInput): DBResponse => {
    const userMatch = this.users.filter(
      item => item.username === user.username
    );
    if (userMatch.length > 0) {
      return {
        error: true,
        message: `User with username ${user.username} already exists!`
      };
    }
    const u = new User(user);
    this.users.push(u);
    this.saveLocal();
    return {
      error: false,
      message: "User created",
      data: u.get()
    };
  };

  public updateUser = (username: string, data: UserUpdateInput): DBResponse => {
    const now = Date.now();
    if (!this.authSession[username]) {
      return {
        error: true,
        message: "Invalid action, login first!"
      };
    } else if (now > this.authSession[username]) {
      delete this.authSession[username];
      this.saveLocal();
      return {
        error: true,
        message: "Invalid action, session expired, please login again!"
      };
    }
    const indexedUser = this.getUserById(username);
    if (indexedUser instanceof Error) {
      return {
        error: true,
        message: "User not found!"
      };
    } else {
      const { user, at } = indexedUser;
      const u = user.update(data);
      this.users[at] = u;
      this.saveLocal();
      return {
        error: false,
        message: "User updated!",
        data: u.get()
      };
    }
  };

  public getUserById = (username: string): UserDBIndex | Error => {
    const users = this.users.filter(item => item.username === username);
    if (!users[0]) return new Error("User not found!");
    return {
      user: users[0],
      at: this.users.indexOf(users[0])
    };
  };

  public deleteUser = (username: string): DBResponse => {
    const now = Date.now();
    if (!this.authSession[username]) {
      return {
        error: true,
        message: "Invalid action, login first!"
      };
    } else if (now > this.authSession[username]) {
      delete this.authSession[username];
      this.saveLocal();
      return {
        error: true,
        message: "Invalid action, session expired, please login again!"
      };
    }
    this.users = this.users.filter(item => item.username !== username);
    this.saveLocal();
    return {
      error: false,
      message: "User deleted!"
    };
  };

  public auth = (username: string, password: string): DBResponse => {
    const userMatch = this.users.filter(
      item =>
        item.username === username && item.password === v5(password, v5.DNS)
    );
    if (!userMatch[0]) {
      return {
        error: true,
        message: "Authentication error, user not found!"
      };
    } else {
      const d1 = new Date();
      const d2 = new Date(d1);
      d2.setMinutes(d1.getMinutes() + 3);
      this.authSession[username] = d2.getTime();
      this.saveLocal();
      return {
        error: false,
        message: "",
        data: userMatch[0].get()
      };
    }
  };

  public getUser = (username: string): DBResponse => {
    const userMatch = this.users.filter(item => item.username === username);
    if (!userMatch[0]) {
      return {
        error: true,
        message: "Get error, user not found!"
      };
    } else {
      return {
        error: false,
        message: "",
        data: userMatch[0].get()
      };
    }
  };

  public getRawUser = (username: string): User | DBResponse => {
    const userMatch = this.users.filter(item => item.username === username);
    if (!userMatch[0]) {
      return {
        error: true,
        message: "Get error, user not found!"
      };
    } else {
      return userMatch[0];
    }
  };

  public getUsers = (): DBResponse => {
    return {
      error: false,
      message: "",
      data: this.users.map(item => item.get())
    };
  };

  public getRawUsers = (): User[] => {
    return this.users;
  };

  //Rooms
  public getRooms = (): DBResponse => {
    return {
      error: false,
      message: "",
      data: this.rooms
        .filter((item, i) => {
          return item ? true : false;
        })
        .map((item: Room) => item.get())
    };
  };

  public addRoom = (room: RoomInput): DBResponse => {
    //@ts-ignore
    const now = Date.now();
    if (!this.authSession[room.host]) {
      return {
        error: true,
        message: "Invalid action, login first!"
      };
    } else if (now > this.authSession[room.host]) {
      delete this.authSession[room.host];
      this.saveLocal();
      return {
        error: true,
        message: "Invalid action, session expired, please login again!"
      };
    }
    const r = new Room(room, this);
    this.rooms.push(r);
    this.saveLocal();
    return {
      error: false,
      message: "Room added",
      data: r.get()
    };
  };

  public changeRoomHost = (
    host: string,
    nextHost: string,
    room: string
  ): DBResponse => {
    const now = Date.now();
    if (!this.authSession[host]) {
      return {
        error: true,
        message: "Invalid action, login first!"
      };
    } else if (now > this.authSession[host]) {
      delete this.authSession[host];
      this.saveLocal();
      return {
        error: true,
        message: "Invalid action, session expired, please login again!"
      };
    }
    const indexedRoom = this.getRoomById(room);
    if (indexedRoom instanceof Error) {
      return {
        error: true,
        message: "Room not found!"
      };
    } else {
      const { room, at } = indexedRoom;
      const r = room.update(nextHost);
      if (!r) {
        return {
          error: true,
          message: "Error updating room host, invalid new host!"
        };
      }
      this.rooms[at] = r as Room;
      this.saveLocal();
      return {
        error: false,
        message: "Host changed!",
        data: this.rooms[at].get()
      };
    }
  };

  public roomInfo = (guid: string): DBResponse => {
    const indexedRoom = this.getRoomById(guid);
    if (indexedRoom instanceof Error) {
      return {
        error: true,
        message: "Room not found!"
      };
    } else {
      return {
        data: indexedRoom.room.get(),
        error: false,
        message: ""
      };
    }
  };

  public joinLeaveRoom = (username: string, room: string): DBResponse => {
    const now = Date.now();
    if (!this.authSession[username]) {
      return {
        error: true,
        message: "Invalid action, login first!"
      };
    } else if (now > this.authSession[username]) {
      delete this.authSession[username];
      this.saveLocal();
      return {
        error: true,
        message: "Invalid action, session expired, please login again!"
      };
    } else {
      const indexedRoom = this.getRoomById(room);
      if (indexedRoom instanceof Error) {
        return {
          error: true,
          message: "Room not found!"
        };
      } else {
        const user = this.getRawUser(username);
        if (user.error) {
          return {
            error: true,
            message: "User not found!"
          };
        } else {
          const { room, at } = indexedRoom;
          const r = room.joinLeaveRoom(user as User);
          if (r.error) {
            return r as DBResponse;
          }
          this.rooms[at] = r.data as Room;
          this.saveLocal();
          return {
            error: false,
            message: "",
            data: room.get()
          };
        }
      }
    }
  };

  public getRoomById = (guid: string): RoomDBIndex | Error => {
    const rooms = this.rooms.filter(item => item.guid === guid);
    if (!rooms[0]) {
      return new Error("Room not found!");
    }
    console.log(rooms[0].participants);

    if (rooms[0] instanceof Room) {
      return {
        room: rooms[0],
        at: this.rooms.indexOf(rooms[0]) || this.rooms.length
      };
    } else {
      const { name, guid, limit, host, participants } = rooms[0];
      const _room = Room.init(
        {
          name,
          guid,
          limit,
          host: host.username,
          participants: participants
            .filter(item => item.username !== host.username)
            .map(item => item.username)
        },
        this
      );

      return {
        room: _room,
        at: this.rooms.indexOf(_room) || this.rooms.length
      };
    }
  };

  public search = (username: string): DBResponse => {
    const rooms = this.rooms.filter((item, i) => {
      const ids = item.participants.map(user => user.username);
      if (ids.includes(username)) return true;
      return false;
    });

    return {
      error: false,
      message: "",
      data: rooms.map(room => room.get())
    };
  };

  saveLocal = () => {
    const data = {
      rooms: this.rooms.map((item: Room) => {
        return {
          name: item.name,
          guid: item.guid,
          limit: item.limit,
          host: item.host.username,
          participants: item.participants
            .map((item_: User) => item_.username)
            .filter((item_: string) => item_ !== item.host.username)
        };
      }),
      users: this.users,
      authSession: this.authSession
    };

    const opt: fs.WriteOptions = {
      flag: "w+"
    };

    fs.writeJSONSync(__dirname + ".store.json", data, opt);
    console.log("saved");
  };
}

const db = new DB();
export default db;
