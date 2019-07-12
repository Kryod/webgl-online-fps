import Behaviour from "./Behaviour.js";

export default class Projectile extends Behaviour {
    constructor(scene, id, pos, team, size = 0.1) {
        super(scene);

        this.geometry = new THREE.SphereGeometry(size, 32, 32);
        this.material = new THREE.MeshLambertMaterial();
        if (team == 0) {
            this.material.color.set("rgb(2, 136, 209)");
        } else if (team == 1) {
            this.material.color.set("rgb(255, 15, 15)");
        } else {
            this.material.color.setRGB(0.9, 0.9, 0.9);
        }
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        if (Array.isArray(pos)) {
            this.mesh.position.set(pos[0], pos[1], pos[2]);
        } else {
            this.mesh.position.set(pos.x, pos.y, pos.z);
        }
        this.mesh.name = "Projectile";
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.timer = 0;
        this.id = id;

        scene.add(this.mesh);
    }

    destroy() {
        super.destroy();
        this.scene.remove(this.mesh);
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
