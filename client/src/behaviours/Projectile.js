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

        this.trail = new THREE.TrailRenderer(scene, false);
        var headGeometry = new THREE.SphereGeometry(size * 1.5, 4, 4);
        var trailMaterial = THREE.TrailRenderer.createBaseMaterial();
        if (team == 0) {
            trailMaterial.uniforms.headColor.value.set(0.0, 0.53, 0.82, 0.1);
            trailMaterial.uniforms.tailColor.value.set(0.2, 0.3, 0.8, 0.05);
        } else {
            trailMaterial.uniforms.headColor.value.set(1.0, 0.05, 0.05, 0.1);
            trailMaterial.uniforms.tailColor.value.set(0.8, 0.2, 0.2, 0.05);
        }
        var trailLength = 10;
        this.trail.initialize(trailMaterial, trailLength, false, 0, headGeometry.vertices, this.mesh);
        this.trail.activate();

        scene.add(this.mesh);
    }

    destroy() {
        super.destroy();
        this.scene.remove(this.mesh);
        this.trail.deactivate();
        this.scene.remove(this.trail);
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

    update() {
        this.trail.advance();
    }
}
