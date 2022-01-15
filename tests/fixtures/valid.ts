export const getParams = {
  id: 123456789,
  first_name: 'John',
  last_name: 'Doe',
  username: 'john_doe',
  photo_url: 'https://t.me/i/userpic/320/XjskdfasdfHGCAShsfgasdf.jpg',
  auth_date: 1642203018, // no milliseconds in response
  hash: '11d90e06007e9b5a139fb3dee0e17c5c011f7c29164ee7513294ed088b05c8c3'
};

// line breaks after each key=value pair are required
export const dataCheckString = `auth_date=${getParams.auth_date}
first_name=${getParams.first_name}
id=${getParams.id}
username=${getParams.username}`;
