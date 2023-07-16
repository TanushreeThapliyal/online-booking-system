# restaurant-booking-system
-- Create the users table CREATE TABLE users ( id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL );

-- Create the sessions table CREATE TABLE sessions ( id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), token TEXT NOT NULL, created_at TIMESTAMP NOT NULL );

-- Create the rooms table CREATE TABLE rooms ( id SERIAL PRIMARY KEY, room_number VARCHAR(10) UNIQUE NOT NULL, capacity INTEGER NOT NULL, amenities TEXT );

-- Create the room_availability table CREATE TABLE room_availability ( id SERIAL PRIMARY KEY, room_id INTEGER REFERENCES rooms(id), date DATE NOT NULL, available BOOLEAN NOT NULL, UNIQUE (room_id, date) );

-- Create the bookings table CREATE TABLE bookings ( id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), room_id INTEGER REFERENCES rooms(id), date DATE NOT NULL );

This is how the api work
User Registration URL: /register Method: POST Description: Register a new user. Request Body:
{ "name": "John Doe", "email": "johndoe@example.com", "password": "password123" } Response:

{ "id": 1, "message": "Registration successful" } 2. User Login URL: /login Method: POST Description: Authenticate user credentials and generate a JWT token. Request Body:

{ "email": "johndoe@example.com", "password": "password123" } Response: json

{ "token": "<JWT_TOKEN>", "message": "Login successful" } 3. Get User Profile URL: /profile Method: GET Description: Get user profile information. Authentication: Bearer Token (Include JWT token in the Authorization header) Response:

{ "id": 1, "name": "John Doe", "email": "johndoe@example.com" } 4. Create Room URL: /rooms Method: POST Description: Create a new room. Request Body:

{ "room_number": "101", "capacity": 4, "amenities": "TV, Wi-Fi" } Response:

{ "id": 1, "message": "Room added successfully" } 5. Delete Room URL: /rooms/:id Method: DELETE Description: Delete a room by ID. Authentication: Bearer Token (Include JWT token in the Authorization header) Response:

{ "message": "Room deleted successfully" } 6. Update Room Availability URL: /rooms/:id/availability Method: PUT Description: Update the availability of a room on a specific date. Request Body:

{ "date": "2023-07-20", "available": true } Response:

{ "message": "Room availability updated successfully" } 7. Book a Room URL: /rooms/:id/bookings Method: POST Description: Book a room for a specific date. Request Body:

{ "date": "2023-07-20" } Authentication: Bearer Token (Include JWT token in the Authorization header) Response:

{ "id": 1, "message": "Booking successful" }
