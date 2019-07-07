import Behaviour from "./Behaviour.js";

export default class Projectile extends Behaviour {
    constructor(scene, pos, forwardVector, size = 0.1, speed = 20, id) {
        super(scene);

        this.geometry = new THREE.SphereGeometry(size, 32, 32);
        this.material = new THREE.MeshLambertMaterial();
        this.material.color.setRGB(0.886, 0.07, 0.0);
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        //this.mesh.position.set(pos.x, pos.y, pos.z);
        if (Array.isArray(pos)) {
            this.mesh.position.set(pos[0], pos[1], pos[2]);
        } else {
            this.mesh.position.set(pos.x, pos.y, pos.z);
        }
        //this.mesh.position.add(forwardVector);
        this.mesh.name = "Projectile";
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.timer = 0;
        this.id = id;

        //this.forwardVector = forwardVector.multiplyScalar(speed);

        scene.add(this.mesh);
    }

    destroy() {
        super.destroy();
        this.scene.remove(this.mesh);
    }

    update(dt) {
        /*this.timer += dt;
        if (this.timer >= 6.0) {
            this.destroy();
        }

        var movement = this.forwardVector.clone().multiplyScalar(dt);
        this.mesh.position.add(movement);*/
    }

    position(val) {
        if (val == undefined) {
            return this.refs.group.position;
        }

        if (Array.isArray(val)) {
            this.mesh.position.set(val[0], val[1], val[2]);
        } else {
            this.mesh.position.set(val.x, val.y, val.z);
        }
    }
}
