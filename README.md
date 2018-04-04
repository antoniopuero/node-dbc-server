# Simple database connectivity server

## Development

To start a server run `npm start` in the root.
By default it will run on `localhost:3000`. To change the port set env variable `PORT` to what you want.

## API

1. `POST {endpoint}/connection/`

It requires such params:

```
{
    url: 'localhost:3306',
    type: 'mysql', // could be mysql or postgresql
    user: 'root',
    password: 'root',
    db: 'test',
    table: 'test'
}
```

2. `POST {endpoint}/connection/recentData/`

It requires all the params from the above but aslo 2 additional params:

```
{
    indexKey: 'id',
    lastIndexValue: 251
}
```

It works with the auto-increment id fields and is suitable for getting only last updated rows from the table.
