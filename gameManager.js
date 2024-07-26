const canvas = document.getElementById("game");
const selectMode = document.getElementById("layout");
const thumbnail = document.getElementById("thumbnail");
const trigger = document.getElementById("trigger");
const bar = document.getElementById("bar");
const container = document.getElementById("container");
const wrap = document.getElementById("wrap");
wrap.style.display = "none";
selectMode.style.visibility = "hidden";
canvas.style.display = "none";
const btnEasy = document.getElementById("btn-easy");
const btnNormal = document.getElementById("btn-normal");
const btnHard = document.getElementById("btn-hard");
const elementArr = [btnEasy, btnNormal, btnHard];
const menu = document.getElementById("menu");
menu.style.visibility = "hidden";
trigger.addEventListener("click", (e) => {
  selectMode.style.visibility = "visible";
});
elementArr.map((element) => {
  element.addEventListener("click", (e) => {
    container.style.display = "none";
    bar.style.display = "block";
    canvas.style.display = "block";
    canvas.style.visibility = "visible";
    menu.style.visibility = "visible";
    wrap.style.display = "flex";
    const game = new Game();
    window.game = game;
    window.game.setLevel(element.innerHTML);
    window.game.start = true;
    selectMode.style.visibility = "hidden";
    thumbnail.style.visibility = "hidden";
  });
});
console.log(menu);
menu.addEventListener("click", (e) => {
  location.reload();
});
