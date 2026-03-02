// door.js
export class Door {
  constructor(scene, x, y, width, height, textureKey) {
    this.scene = scene;
    this.locked = true;
    this.open = false;

    this.rect = new Phaser.Geom.Rectangle(
      x - width / 2,
      y - height / 2,
      width,
      height
    );

    this.image = scene.add.image(x, y, textureKey);
    this.image.setDisplaySize(width, height);
  }

  blocksCircle(x, y, radius) {
    if (this.open) return false;
    const circle = new Phaser.Geom.Circle(x, y, radius);
    return Phaser.Geom.Intersects.CircleToRectangle(circle, this.rect);
  }

  tryOpen(playerX, playerY, playerRadius, hasKey) {
    if (!hasKey) return;

    // Only open if player is touching the door
    if (this.blocksCircle(playerX, playerY, playerRadius)) {
      this.locked = false;
      this.open = true;
      this.image.setVisible(false);
    }
  }
}