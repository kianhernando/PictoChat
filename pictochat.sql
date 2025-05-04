-- pictochat.sql
set foreign_key_checks = 0;

DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS messages;

-- create users table
CREATE TABLE users (
    id int auto_increment PRIMARY KEY,
    username varchar(30) NOT NULL,
    created_at datetime default current_timestamp
);

-- create rooms table
CREATE TABLE rooms (
    id int auto_increment PRIMARY KEY,
    name varchar(1) NOT NULL UNIQUE,   -- A, B, C, D
    created_at datetime default current_timestamp
);

-- create messages table
CREATE TABLE messages (
    id int auto_increment PRIMARY KEY,
    user_id int NOT NULL,       -- links to user who sent message
    room_id int NOT NULL,
    type int NOT NULL,          -- 1 = text, 2 = url to image
    payload varchar(255) NOT NULL,      -- stores content of message (text or url to image)
    created_on datetime default current_timestamp,
    foreign key (user_id) references users(id) ON DELETE CASCADE,
    foreign key (room_id) references rooms(id) ON DELETE CASCADE   
    -- if you delete user from users table, all messages that 
    -- belong to that user will be deleted
);

-- default rooms
insert into rooms (name) values ('A'), ('B'), ('C'), ('D');

set foreign_key_checks = 1;