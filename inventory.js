// inventory.js
export class Inventory {
  constructor(scene) {
    this.scene = scene;
    this.items = new Set();

    // inventory box in top-left (UI = does NOT scroll)
    this.box = scene.add.rectangle(30, 30, 44, 44, 0x111111).setOrigin(0.5);
    this.boxOutline = scene.add.rectangle(30, 30, 44, 44).setOrigin(0.5);
    this.boxOutline.setStrokeStyle(2, 0xffffff, 1);

    this.box.setScrollFactor(0);
    this.boxOutline.setScrollFactor(0);

    this.icons = {};
  }

  addItem(name) {
    this.items.add(name);
    if (this.icons[name]) this.icons[name].setVisible(true);
  }

  hasItem(name) {
    return this.items.has(name);
  }

  setIcon(name, imageKey) {
    const icon = this.scene.add.image(30, 30, imageKey).setScale(0.6);
    icon.setVisible(this.hasItem(name));

    // IMPORTANT: UI should not move with camera
    icon.setScrollFactor(0);

    this.icons[name] = icon;
  }
}