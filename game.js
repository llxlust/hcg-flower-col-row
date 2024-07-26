// JavaScript Document
class Game {
  constructor() {
    this.destroyList = [];
    this.start = false;
    this.over = false;
    this.avaliable = [];
    this.level = "Easy";
    this.stageLevel = 0;
    this.stageScore = 0;
    this.moveLabel = document.getElementById("move");
    this.targetLabel = document.getElementById("score");
    this.possibleMove = 0;
    this.canvas = document.getElementById("game");
    this.context = this.canvas.getContext("2d");
    this.lastRefreshTime = Date.now();
    this.sinceLastSpawn = 0;
    this.sprites = [];
    this.score = 0;
    this.spriteData;
    this.spriteImage;
    this.flowers = [];
    this.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();

    this.correctSfx = new SFX({
      context: this.audioContext,
      src: { mp3: "gliss.mp3", webm: "gliss.webm" },
      loop: false,
      volume: 0.3,
    });
    this.wrongSfx = new SFX({
      context: this.audioContext,
      src: { mp3: "boing.mp3", webm: "boing.webm" },
      loop: false,
      volume: 0.3,
    });
    this.dropSfx = new SFX({
      context: this.audioContext,
      src: { mp3: "swish.mp3", webm: "swish.webm" },
      loop: false,
      volume: 0.3,
    });

    const game = this;
    this.loadJSON("jewel", function (data, game) {
      game.spriteData = JSON.parse(data);
      game.spriteImage = new Image();
      game.spriteImage.src = game.spriteData.meta.image;
      game.spriteImage.onload = function () {
        game.init();
      };
    });
  }

  loadJSON(json, callback) {
    const xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open("GET", json + ".json", true);
    const game = this;
    xobj.onreadystatechange = function () {
      if (xobj.readyState == 4 && xobj.status == "200") {
        callback(xobj.responseText, game);
      }
    };
    xobj.send(null);
  }

  init() {
    const sourceSize = this.spriteData.frames[0].sourceSize;
    this.gridSize = {
      rows: 9,
      cols: 10,
      width: sourceSize.w,
      height: sourceSize.h,
    };
    const topleft = { x: 100, y: 40 };
    this.spawnInfo = { count: 0, total: 0 };
    this.flowers = [];
    for (let row = 0; row < this.gridSize.rows; row++) {
      let y = row * this.gridSize.height + topleft.y;
      this.flowers.push([]);
      for (let col = 0; col < this.gridSize.cols; col++) {
        let x = col * this.gridSize.width + topleft.x;
        const sprite = this.spawn(x, y);
        this.flowers[row].push(sprite);
        this.spawnInfo.total++;
      }
    }
    this.gridSize.topleft = topleft;
    const game = this;
    this.canvas.addEventListener("loadstart", (e) => {
      console.log("aaa");
    });
    if ("ontouchstart" in window) {
      this.canvas.addEventListener("touchstart", function (event) {
        game.tap(event);
      });
    } else {
      this.canvas.addEventListener("mousedown", function (event) {
        game.tap(event);
      });
    }
    this.canvas.addEventListener("mouseup", (event) => {
      console.log("Here");
    });
    this.state = "spawning";
    this.refresh();
  }

  refresh() {
    const now = Date.now();
    const dt = (now - this.lastRefreshTime) / 1000.0;

    this.update(dt);
    this.render();

    this.lastRefreshTime = now;

    const game = this;
    requestAnimationFrame(function () {
      game.refresh();
    });
  }
  setLevel(level) {
    this.level = level;
  }
  checkAvaliableMove() {
    for (let sprite of this.sprites) {
      if (this.state != "ready") return;
      //Need to find this sprite in the flowers grid
      let row,
        col,
        found = false;
      //First put flags to show if they have been checked
      for (let sprite of this.sprites) sprite.checked = false;
      let i = 0;
      for (row of this.flowers) {
        col = row.indexOf(sprite);
        if (col != -1) {
          //Found it
          row = i;
          found = true;
          break;
        }
        i++;
      }
      if (found) {
        const connected = this.getConnectedSprites(sprite.index, row, col);
        if (connected.length > 2) {
          const set = [];
          for (let sprite of connected) {
            set.push(sprite);
          }
          console.log(set, ":avaliable");
        }
      }
    }
  }
  update(dt) {
    if (this.start) {
      let removed;
      do {
        removed = false;
        let i = 0;

        for (let sprite of this.sprites) {
          if (sprite.kill) {
            this.sprites.splice(i, 1);
            this.clearGrid(sprite);
            removed = true;

            break;
          }
          i++;
        }
      } while (removed);

      switch (this.state) {
        case "spawning":
          if (this.spawnInfo.count == this.spawnInfo.total) {
            delete this.spawnInfo;
            this.state = "ready";
          }
          break;
        case "removing":
          if (this.removeInfo.count == this.removeInfo.total) {
            delete this.removeInfo;
            this.removeGridGaps();
            this.state = "dropping";
            this.avaliable = [];
            this.possibleMove = 0;
            this.dropSfx.play();
          }
          break;
        case "dropping":
          if (this.dropInfo.count == this.dropInfo.total) {
            delete this.dropInfo;
            this.state = "ready";
          }
          break;
      }
      if (this.state === "ready") {
        this.moveLabel.innerHTML = `Move avaliable : ${this.possibleMove}`;
      } else {
        this.moveLabel.innerHTML = `Calculating . . .`;
      }
      for (let sprite of this.sprites) {
        if (sprite == null) continue;
        sprite.update(dt);
      }
      if (this.stageLevel === 0) {
        this.stageScore = 30;
        this.targetLabel.innerHTML = `${this.stageScore}`;
      } else {
        this.stageScore = (this.stageLevel + 1) * 30;
        this.targetLabel.innerHTML = `${this.stageScore}`;
      }

      if (this.score >= this.stageScore) {
        this.stageLevel++;
        console.log(this.stageLevel, ":current stage");
      }

      for (let sprite of this.sprites) {
        if (this.state != "ready") return;
        //Need to find this sprite in the flowers grid
        let row,
          col,
          found = false;
        //First put flags to show if they have been checked
        for (let sprite of this.sprites) sprite.checked = false;
        let i = 0;
        for (row of this.flowers) {
          col = row.indexOf(sprite);
          if (col != -1) {
            //Found it
            row = i;
            found = true;
            break;
          }
          i++;
        }
        if (found && sprite.index === 5) {
          const connected = this.getConnectedSprites(sprite.index, row, col);
          if (connected.length > 2) {
            for (let sprite of connected) {
              sprite.state = sprite.states.die;
            }
            this.score -= connected.length;
            this.state = "removing";
            this.removeInfo = { count: 0, total: connected.length };
          }
          // if (sprite.index === 6 && connected.length > 2) {
          // 	for (let sprite of connected) {
          // 		sprite.state = sprite.states.die;
          // 	}
          // 	this.score -= connected.length;
          // 	this.state = "removing";
          // 	this.removeInfo = { count: 0, total: connected.length };
          // }
        }
      }
      for (let sprite of this.sprites) {
        if (this.state != "ready") return;
        //Need to find this sprite in the flowers grid
        let row,
          col,
          found = false;
        //First put flags to show if they have been checked
        for (let sprite of this.sprites) sprite.checked = false;
        let i = 0;
        for (row of this.flowers) {
          col = row.indexOf(sprite);
          if (col != -1) {
            //Found it
            row = i;
            found = true;
            break;
          }
          i++;
        }
        if (found) {
          const connected = this.getConnectedSprites(sprite.index, row, col);
          if (connected.length > 2) {
            for (let sprite of connected) {
              if (!this.avaliable.includes(sprite)) {
                this.avaliable.push(sprite);
                if (sprite === connected[connected.length - 1]) {
                  this.possibleMove += 1;
                }
              }
            }
          }
        }
      }
    }

    if (this.start && this.possibleMove === 0 && this.state === "ready") {
      this.start = !this.start;
      alert("Game over!,No move avaliable ");
      location.reload();
    }
  }

  modeHandler() {
    const calCulateWeight = (rangeArr, range) => {
      for (let i = 0; i < rangeArr.length; i++) {
        currentWeight += rangeArr[i].weight;
        if (range <= currentWeight) {
          return rangeArr[i].id;

          break;
        }
      }
    };
    let currentWeight = 0;
    let rangeArr;
    let range = Math.floor(Math.random() * 100);
    switch (this.level) {
      case "Easy":
        rangeArr = [
          {
            id: 1,
            weight: 40,
          },
          {
            id: 2,
            weight: 20,
          },
          {
            id: 3,
            weight: 15,
          },
          {
            id: 4,
            weight: 15,
          },
          {
            id: 5,
            weight: 10,
          },
        ];
        break;
      case "Normal":
        rangeArr = [
          {
            id: 1,
            weight: 25,
          },
          {
            id: 2,
            weight: 20,
          },
          {
            id: 3,
            weight: 20,
          },
          {
            id: 4,
            weight: 20,
          },
          {
            id: 5,
            weight: 15,
          },
        ];
        break;
      case "Hard":
        rangeArr = [
          {
            id: 1,
            weight: 15,
          },
          {
            id: 2,
            weight: 20,
          },
          {
            id: 3,
            weight: 20,
          },
          {
            id: 4,
            weight: 20,
          },
          {
            id: 5,
            weight: 25,
          },
        ];
    }
    return calCulateWeight(rangeArr, range);
  }

  spawn(x, y) {
    const index = this.modeHandler();
    const frameData = this.spriteData.frames[index];
    const s = new Sprite({
      game: this,
      context: this.context,
      x: x,
      y: y,
      index: index,
      width: frameData.sourceSize.w,
      height: frameData.sourceSize.h,
      frameData: frameData,
      anchor: { x: 0.5, y: 0.5 },
      image: this.spriteImage,
      json: this.spriteData,
      states: {
        spawn: { duration: 0.5 },
        static: { duration: 1.5 },
        die: { duration: 0.8 },
        drop: { moveY: 450 },
      },
    });

    this.sprites.push(s);
    this.sinceLastSpawn = 0;

    return s;
  }

  render() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let sprite of this.sprites) sprite.render();

    this.context.font = "20px Verdana";
    this.context.fillStyle = "#999";
    let str = "Score";
    let txt = this.context.measureText(str);
    let left = (this.gridSize.topleft.x - 32 - txt.width) / 2;
    this.context.fillText("Score", left, 30);
    this.context.font = "30px Verdana";
    this.context.fillStyle = "#333";
    str = String(this.score);
    txt = this.context.measureText(str);
    left = (this.gridSize.topleft.x - 32 - txt.width) / 2;
    if (this.score < 0) {
      this.context.fillStyle = "red";
    } else if (this.score > 0) {
      this.context.fillStyle = "green";
    } else {
      this.context.fillStyle = "black";
    }
    this.context.fillText(this.score, left, 65);
  }

  getMousePos(evt) {
    const rect = this.canvas.getBoundingClientRect();
    const scale = {
      x: this.canvas.width / rect.width,
      y: this.canvas.height / rect.height,
    };
    const clientX = evt.targetTouches
      ? evt.targetTouches[0].clientX
      : evt.pageX;
    const clientY = evt.targetTouches
      ? evt.targetTouches[0].clientY
      : evt.pageY;
    return {
      x: (clientX - rect.left) * scale.x,
      y: (clientY - rect.top) * scale.y,
    };
  }

  tap(evt) {
    console.log(this.level, ":this level");
    if (this.state != "ready") return;
    const mousePos = this.getMousePos(evt);
    const canvasScale = this.canvas.width / this.canvas.offsetWidth;
    const loc = {};
    loc.x = mousePos.x * canvasScale;
    loc.y = mousePos.y * canvasScale;
    for (let sprite of this.sprites) {
      if (sprite.hitTest(loc)) {
        console.log(sprite.index);
        //Need to find this sprite in the flowers grid
        let row,
          col,
          found = false;
        //First put flags to show if they have been checked
        for (let sprite of this.sprites) sprite.checked = false;
        let i = 0;
        for (row of this.flowers) {
          col = row.indexOf(sprite);
          if (col != -1) {
            //Found it
            row = i;
            found = true;
            break;
          }
          i++;
        }
        if (found) {
          const connected = this.getConnectedSprites(sprite.index, row, col);
          if (connected.length >= 3 || sprite.index === 6) {
            this.correctSfx.play();
            for (let sprite of connected) {
              sprite.state = sprite.states.die;
            }
            console.log(sprite.index);
            if (sprite.index === 6) {
              this.score -= connected.length;
            } else {
              this.score += connected.length;
            }

            this.state = "removing";
            this.removeInfo = { count: 0, total: connected.length };
          } else {
            this.wrongSfx.play();
          }
        }
      }
    }
  }

  getConnectedSprites(index, row, col, connected = []) {
    //console.log(row,col)
    let factorCheck = 1;
    const sprite = this.flowers[row][col];
    const grid = this.flowers;
    //console.log(sprite,":sprite")
    try {
      if (sprite.index == index && !sprite.checked) {
        connected.push(sprite);
        sprite.checked = true;
        //this.flowers[row][col] = null;
        for (let r = row - 1; r <= row + 1; r++) {
          if (!boundaryCheck(r, 0)) continue;

          if (row === r) {
            for (let c = col - 1; c <= col + 1; c++) {
              if (!boundaryCheck(r, c)) continue;
              connected.concat(
                this.getConnectedSprites(index, r, c, connected)
              );
            }
          } else {
            for (let c = col; c <= col; c++) {
              if (!boundaryCheck(r, c)) continue;
              connected.concat(
                this.getConnectedSprites(index, r, c, connected)
              );
            }
          }
        }
      }
    } catch (e) {
      console.log(`Problem with ${row},`);
    }
    sprite.checked = true;
    //console.log(`getConnectedSprites ${row},${col},${connected.length}`);
    return connected;
    function boundaryCheck(row, col) {
      if (row < 0 || row >= grid.length || col < 0 || col >= grid[0].length)
        return false;
      return true;
    }
  }

  removeGridGaps() {
    this.dropInfo = { count: 0, total: 0 };
    for (let col = 0; col < this.flowers[0].length; col++) {
      let row;
      let count;
      for (row = this.flowers.length - 1; row >= 0; row--) {
        if (this.flowers[row][col] == null) {
          //Find the first non-null cell above and pull it down to this cell
          count = 0;
          for (let r = row - 1; r >= 0; r--) {
            var sprite = this.flowers[r][col];
            count++;
            if (sprite != null) {
              //Swap the array items
              [this.flowers[row][col], this.flowers[r][col]] = [
                this.flowers[r][col],
                this.flowers[row][col],
              ];
              sprite.initDrop(
                this.gridSize.topleft.y + this.gridSize.height * row
              );
              break;
            }
          }
        }
      }
      for (row = this.flowers.length - 1; row >= 0; row--) {
        if (this.flowers[row][col] == null) {
          break;
        }
      }
      for (let r = row; r >= 0; r--) {
        let x = col * this.gridSize.width + this.gridSize.topleft.x;
        let y = this.gridSize.topleft.y - this.gridSize.height * (row - r + 1);
        const sprite = this.spawn(x, y);
        this.flowers[r][col] = sprite;
        sprite.initDrop(this.gridSize.topleft.y + r * this.gridSize.height);
      }
    }
  }
  clearGrid(sprite) {
    for (let row of this.flowers) {
      let col = row.indexOf(sprite);
      if (col != -1) {
        //Found it
        row[col] = null;
        return true;
      }
    }
    return false; //sprite not found
  }
}
