import Behaviour from "./Behaviour.js";

export default class Projectile extends Behaviour {
    constructor(scene, pos, forwardVector, size = 0.1, speed = 20) {
        super(scene);

        this.geometry = new THREE.SphereGeometry(size, 32, 32);
        this.material = new THREE.MeshLambertMaterial();
        this.material.color.setRGB(0.886, 0.07, 0.0);
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.set(pos.x, pos.y, pos.z);
        this.mesh.position.add(forwardVector);
        this.mesh.name = "Projectile";
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.timer = 0;

        this.forwardVector = forwardVector.multiplyScalar(speed);

        scene.add(this.mesh);
    }

    update(dt) {
        this.timer += dt;
        if (this.timer >= 6.0) {
            this.destroy();
        }

        var movement = this.forwardVector.clone().multiplyScalar(dt);
        this.mesh.position.add(movement);
    }
}