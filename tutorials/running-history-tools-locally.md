# Running History Tools locally

This tutorial provides a comprehensive guide to run History Tools on your local machine.

[Back to Readme](../README.md)

If you followed the instructions from the previous tutorial [Writing your own History Tools](./writing-history-tools.md) now to run the tools locally you must first start the database. If you don't have a local server, you can run it on docker. You can use the following content for docker-compose.yml

```bash
version: "3.2"
services:
  mongo:
    image: mongo
    container_name: 'mongo'
    restart: always
    mem_limit: 2g
    ports:
      - '27017:27017'
    networks:
      - mongo_net

networks:
  mongo_net:
    driver: bridge
``` 

Then open a new terminal session for each of the History tools processes and enter the startup command for each of them accordingly:

```bash
# terminal 1
yarn broadcast

# terminal 2
yarn boot

# terminal 3
yarn reader

# terminal 4
yarn filter

# terminal 5
yarn processor
```