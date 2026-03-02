// key.js
export class Key {
  constructor(scene, x, y, textureKey) {
    this.scene = scene;
    this.pos = new Phaser.Math.Vector2(x, y);
    this.collected = false;

    this.image = scene.add.image(x, y, textureKey);
    this.image.setScale(0.5);
  }

  touchesCircle(circleX, circleY, radius) {
    // Simple: treat key like a point in the middle
    const dx = circleX - this.pos.x;
    const dy = circleY - this.pos.y;
    return (dx * dx + dy * dy) < (radius * radius);
  }

  collect() {
    this.collected = true;
    this.image.setVisible(false);
  }
}