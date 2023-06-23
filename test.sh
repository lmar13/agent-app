#!/bin/bash

if [ -d ~/.nvm ]
  then
    source ~/.nvm/nvm.sh
    nvm install 20.3.1
    nvm use 20.3.1
fi