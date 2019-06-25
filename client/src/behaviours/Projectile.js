import Behaviour from "./Behaviour.js";
import InputManager from "../InputManager.js";

export default class Projectile extends Behaviour {
    constructor(scene, size = 0.1, x, y, z, forwarVector) {
        super(scene);

        this.rotationSpeed = 2.0;

        this.geometry = new THREE.SphereGeometry(size, 32, 32);
        this.material = new THREE.MeshLambertMaterial();
        this.material.color.setRGB(0.886, 0.07, 0.0);
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.x = x;
        this.mesh.position.y = y;
        this.mesh.position.z = z;
        this.mesh.position.add(forwarVector.multiplyScalar(2));
        this.mesh.name = "Projectile";
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.timer = 0;

        this.forwarVector = forwarVector.multiplyScalar(0.2);

        scene.add(this.mesh);
    }

    update(dt) {
        this.timer += dt;
        if (this.timer >= 6.0) {
            this.destroy();
        }
        this.mesh.position.add(this.forwarVector);

    }
}