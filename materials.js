export const materials = [
  {
    id: 1,
    name: "PLYWOOD",
    standard: "DIN7500M TX M6X40 Zn",
    mv: 180,
    mvs: 150,
    rpp: 350,
    stock: 2500,
    unit: "kom",
    status: "In stock"
  },
  {
    id: 2,
    name: "CETRIS",
    standard: "DIN7505A 5X40 Zn",
    mv: 180,
    mvs: 150,
    rpp: 350,
    stock: 1800,
    unit: "kom",
    status: "In stock"
  },
  {
    id: 3,
    name: "WALL PANELS",
    standard: "JT3-D6H-5,5/6,3x127",
    mv: 250,
    mvs: 200,
    rpp: 2000,
    stock: 5100,
    unit: "kom",
    status: "In stock"
  },
  {
    id: 4,
    name: "CEILING PANELS",
    standard: "JT3-D6H-5,5/6,3x127",
    mv: 250,
    mvs: 200,
    rpp: 400,
    stock: 3200,
    unit: "kom",
    status: "In stock"
  },
  {
    id: 5,
    name: "EXTERNAL PANELS",
    standard: "JT3-12-5,5x40",
    mv: 240,
    mvs: 200,
    rpp: 600,
    stock: 2600,
    unit: "kom",
    status: "In stock"
  }
];

export function renderMaterials() {

  return `
<div class="materials-page">

<div class="materials-header">

<h2>📦 Materials</h2>

<div class="materials-actions">

<button class="action-btn">
➕ Add Material
</button>

<button class="action-btn">
📥 Import
</button>

<button class="action-btn">
📤 Export
</button>

</div>

</div>

<input
class="material-search"
placeholder="Search material..."
>

<div class="materials-list">

${materials.map(m=>`

<div class="material-card">

<div class="material-top">

<div>

<h3>${m.name}</h3>

<p>${m.standard}</p>

</div>

<span class="status">
🟢 ${m.status}
</span>

</div>

<div class="material-bottom">

<span>MV <b>${m.mv}</b></span>

<span>MVS <b>${m.mvs}</b></span>

<span>RPP <b>${m.rpp}</b></span>

<span>Stock <b>${m.stock} ${m.unit}</b></span>

</div>

</div>

`).join("")}

</div>

</div>
`;
}
