const canvas = document.getElementById("game");
const selectMode = document.getElementById("layout");
const thumbnail = document.getElementById("thumbnail");
const trigger = document.getElementById("trigger");
selectMode.style.visibility = "hidden";
canvas.style.visibility = "hidden";
canvas.style.width = 0;
canvas.style.height = 0;
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
    canvas.style.width = "800px";
    canvas.style.height = "600px";
    canvas.style.visibility = "visible";
    menu.style.visibility = "visible";
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
