import Behaviour from "./Behaviour.js";
import InputManager from "../InputManager.js";

export default class Cube extends Behaviour {
    constructor(scene, size = 3.0) {
        super(scene);

        this.rotationSpeed = 2.0;

        this.geometry = new THREE.BoxGeometry(size, size, size);
        this.material = new THREE.MeshLambertMaterial();
        this.material.color.setRGB(0.886, 0.07, 0.0);
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.y = size / 2;
        this.mesh.name = "Cube";
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        scene.add(this.mesh);
    }

    update(dt) {
        this.mesh.rotation.y += dt * this.rotationSpeed;

        if (InputManager.getKeyDown(' ')) {
            this.rotationSpeed *= -1.0;
        }
        if (InputManager.getKeyDown('c')) {
            this.material.color.setRGB(Math.random(0.0, 1.0), Math.random(0.0, 1.0), Math.random(0.0, 1.0));
        }
    }
}
