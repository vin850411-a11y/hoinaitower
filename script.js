const diskCountSelect = document.querySelector("#diskCount");
const teacherModeInput = document.querySelector("#teacherMode");
const restartButton = document.querySelector("#restartButton");
const moveCountEl = document.querySelector("#moveCount");
const bestCountEl = document.querySelector("#bestCount");
const messageEl = document.querySelector("#message");
const towerEls = [...document.querySelectorAll(".tower")];

let diskCount = 3;
let towers = [];
let selection = null;
let moves = 0;
let finished = false;

for (let count = 1; count <= 7; count += 1) {
  const option = document.createElement("option");
  option.value = String(count);
  option.textContent = `${count} 片`;
  if (count === diskCount) option.selected = true;
  diskCountSelect.append(option);
}

function resetGame() {
  diskCount = Number(diskCountSelect.value);
  towers = [Array.from({ length: diskCount }, (_, index) => diskCount - index), [], []];
  selection = null;
  moves = 0;
  finished = false;
  moveCountEl.textContent = "0";
  bestCountEl.textContent = String(2 ** diskCount - 1);
  messageEl.textContent = teacherModeInput.checked
    ? "教師模式：可點任一圓盤，移動該圓盤以上的整疊。"
    : "從左柱開始，把圓盤移到中柱或右柱。";
  render();
}

function render() {
  document.body.classList.toggle("teacher-enabled", teacherModeInput.checked);

  towerEls.forEach((towerEl, towerIndex) => {
    towerEl.replaceChildren();
    towerEl.classList.toggle("selected", selection?.tower === towerIndex && selection.index === towers[towerIndex].length - 1);
    towerEl.classList.toggle("stack-source", selection?.tower === towerIndex && selection.index < towers[towerIndex].length - 1);
    towerEl.classList.toggle("complete", finished && towerIndex !== 0 && towers[towerIndex].length === diskCount);

    towers[towerIndex].forEach((size, stackIndex) => {
      const disk = document.createElement("div");
      const minWidth = 36;
      const maxWidth = 92;
      const diskWidth = diskCount === 1
        ? 62
        : minWidth + ((size - 1) / (diskCount - 1)) * (maxWidth - minWidth);

      disk.className = "disk";
      disk.style.setProperty("--disk-width", diskWidth);
      disk.dataset.tower = String(towerIndex);
      disk.dataset.index = String(stackIndex);
      disk.setAttribute("aria-label", `第 ${stackIndex + 1} 層圓盤`);
      disk.classList.toggle("moving", selection?.tower === towerIndex && stackIndex >= selection.index);
      towerEl.append(disk);
    });
  });
}

function canMove(from, fromIndex, to) {
  const movingDisk = towers[from][fromIndex];
  const targetDisk = towers[to].at(-1);
  return movingDisk !== undefined && (targetDisk === undefined || movingDisk < targetDisk);
}

function checkWin() {
  const winningTower = towers.findIndex((tower, index) => index !== 0 && tower.length === diskCount);
  if (winningTower === -1) return false;

  finished = true;
  selection = null;
  const towerName = winningTower === 1 ? "中柱" : "右柱";
  messageEl.textContent = `完成！你用了 ${moves} 步把所有圓盤移到${towerName}。`;
  return true;
}

function selectDisk(tower, index) {
  if (finished) return;

  const selectedIndex = teacherModeInput.checked ? index : towers[tower].length - 1;
  if (selectedIndex < 0) {
    messageEl.textContent = "請先選擇有圓盤的柱子。";
    return;
  }

  selection = { tower, index: selectedIndex };
  const stackSize = towers[tower].length - selectedIndex;
  messageEl.textContent = teacherModeInput.checked && stackSize > 1
    ? `已選取 ${stackSize} 片圓盤，請選擇目標柱。`
    : "再選擇要移動到哪一根柱子。";
  render();
}

function handleTowerClick(toTower) {
  if (finished) return;

  if (selection === null) {
    if (towers[toTower].length === 0) {
      messageEl.textContent = "請先選擇有圓盤的柱子。";
      return;
    }
    selectDisk(toTower, towers[toTower].length - 1);
    return;
  }

  if (selection.tower === toTower) {
    selection = null;
    messageEl.textContent = "已取消選取。";
    render();
    return;
  }

  if (!canMove(selection.tower, selection.index, toTower)) {
    messageEl.textContent = "大圓盤不能放在小圓盤上。";
    selection = null;
    render();
    return;
  }

  const movingStack = towers[selection.tower].splice(selection.index);
  towers[toTower].push(...movingStack);
  moves += 1;
  moveCountEl.textContent = String(moves);
  selection = null;

  if (!checkWin()) {
    messageEl.textContent = "漂亮，繼續移動。";
  }
  render();
}

towerEls.forEach((towerEl) => {
  towerEl.addEventListener("click", () => {
    handleTowerClick(Number(towerEl.dataset.tower));
  });
});

document.addEventListener("click", (event) => {
  if (!teacherModeInput.checked || !event.target.classList.contains("disk")) return;

  event.stopPropagation();
  selectDisk(Number(event.target.dataset.tower), Number(event.target.dataset.index));
}, true);

diskCountSelect.addEventListener("change", resetGame);
restartButton.addEventListener("click", resetGame);
teacherModeInput.addEventListener("change", () => {
  selection = null;
  messageEl.textContent = teacherModeInput.checked
    ? "教師模式：可點任一圓盤，移動該圓盤以上的整疊。"
    : "一般模式：每次只能移動最上方一片圓盤。";
  render();
});

resetGame();
