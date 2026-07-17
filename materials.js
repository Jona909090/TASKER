export const materials = [
  {
    id: 1,
    name: "PLYWOOD",
    category: "Wood",
    standard: "DIN7500M TX M6X40 Zn",
    supplier: "Hilti",
    location: "A-01",
    unit: "kom",
    price: 0.38,
    minStock: 500,
    stock: 2500,
    mv: 180,
    mvs: 150,
    rpp: 350,
    image: "images/placeholder.png"
  },
  {
    id: 2,
    name: "CETRIS",
    category: "Boards",
    standard: "DIN7505A 5X40 Zn",
    supplier: "Knauf",
    location: "A-02",
    unit: "kom",
    price: 0.42,
    minStock: 400,
    stock: 1800,
    mv: 180,
    mvs: 150,
    rpp: 350,
    image: "images/placeholder.png"
  },
  {
    id: 3,
    name: "WALL PANELS",
    category: "Panels",
    standard: "JT3-D6H-5,5/6,3x127",
    supplier: "Kingspan",
    location: "B-01",
    unit: "kom",
    price: 5.60,
    minStock: 300,
    stock: 5100,
    mv: 250,
    mvs: 200,
    rpp: 2000,
    image: "images/placeholder.png"
  },
  {
    id: 4,
    name: "CEILING PANELS",
    category: "Panels",
    standard: "JT3-D6H-5,5/6,3x127",
    supplier: "Kingspan",
    location: "B-02",
    unit: "kom",
    price: 5.90,
    minStock: 300,
    stock: 3200,
    mv: 250,
    mvs: 200,
    rpp: 400,
    image: "images/placeholder.png"
  },
  {
    id: 5,
    name: "EXTERNAL PANELS",
    category: "Panels",
    standard: "JT3-12-5,5x40",
    supplier: "Kingspan",
    location: "B-03",
    unit: "kom",
    price: 6.10,
    minStock: 300,
    stock: 2600,
    mv: 240,
    mvs: 200,
    rpp: 600,
    image: "images/placeholder.png"
  }
];

function getStatus(material) {
  if (material.stock <= 0) {
    return {
      text: "Out of stock",
      color: "#ef4444"
    };
  }

  if (material.stock <= material.minStock) {
    return {
      text: "Low stock",
      color: "#f59e0b"
    };
  }

  return {
    text: "In stock",
    color: "#22c55e"
  };
}

export function renderMaterials() {

  return `

<div class="materials-page">

<div class="materials-header">

<h2>📦 Materials</h2>

<div class="materials-actions">

<button class="action-btn">➕ Add Material</button>

<button class="action-btn">📥 Import</button>

<button class="action-btn">📤 Export</button>

</div>

</div>

<input
class="material-search"
placeholder="Search material..."
>

<div class="materials-list">

${materials.map(material=>{

const status=getStatus(material);

return `

<div class="material-card">

<div class="material-top">

<div>

<h3>${material.name}</h3>

<p>${material.standard}</p>

</div>

<span
class="status"
style="background:${status.color};"
>

${status.text}

</span>

</div>

<div class="material-bottom">

<span>Category <b>${material.category}</b></span>

<span>Supplier <b>${material.supplier}</b></span>

<span>Location <b>${material.location}</b></span>

<span>Price <b>€${material.price}</b></span>

<span>MV <b>${material.mv}</b></span>

<span>MVS <b>${material.mvs}</b></span>

<span>RPP <b>${material.rpp}</b></span>

<span>Stock <b>${material.stock} ${material.unit}</b></span>

</div>

</div>

`;

}).join("")}

</div>

</div>

`;

}
