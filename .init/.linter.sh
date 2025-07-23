#!/bin/bash
cd /home/kavia/workspace/code-generation/classic-snake-game-04abdedc/snake_game_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

