import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import * as AMMO from 'ammo.js';

class Basic {
	constructor(target) {
		this.target = target;
		const renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setPixelRatio(window.devicePixelRatio);
		this.target.appendChild(renderer.domElement);

		renderer.shadowMap.enabled = true;
		this._renderer = renderer;

		const scene = new THREE.Scene();
		this._scene = scene;

		this._setupCamera();
		this._setupLight();
		this._setupAmmo();
		// this._setupModel();
		this._setupControls();

		window.onresize = this.resize.bind(this);
		this.resize();

		requestAnimationFrame(this.render.bind(this));
	}

	_setupAmmo() {
		AMMO().then(Ammo => {
			const overlappingPairCache = new Ammo.btDbvtBroadphase();
			const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
			const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
			const solver = new Ammo.btSequentialImpulseConstraintSolver();

			const physicsWorld = new Ammo.btDiscreteDynamicsWorld(
				dispatcher,
				overlappingPairCache,
				solver,
				collisionConfiguration,
			);
			physicsWorld.setGravity(new Ammo.btVector3(0, -9.807, 0));

			this.Ammo = Ammo;
			this._physicsWorld = physicsWorld;
			this._setupModel();
		});
	}

	_setupControls() {
		new OrbitControls(this._camera, this.target);
	}

	_createTable() {
		const position = { x: 0, y: -0.525, z: 0 };
		const scale = { x: 30, y: 0.5, z: 30 };

		const tableGeometry = new THREE.BoxGeometry();
		const tableMaterial = new THREE.MeshPhongMaterial({ color: 0x878787 });
		const table = new THREE.Mesh(tableGeometry, tableMaterial);

		table.position.set(position.x, position.y, position.z);
		table.scale.set(scale.x, scale.y, scale.z);

		table.receiveShadow = true;
		this._scene.add(table);

		const transform = new this.Ammo.btTransform();
		const quaternion = { x: 0, y: 0, z: 0, w: 1 };
		transform.setIdentity();
		transform.setOrigin(
			new this.Ammo.btVector3(position.x, position.y, position.z),
		);
		transform.setRotation(
			new this.Ammo.btQuaternion(
				quaternion.x,
				quaternion.y,
				quaternion.z,
				quaternion.w,
			),
		);
		const motionState = new this.Ammo.btDefaultMotionState(transform);
		const colShape = new this.Ammo.btBoxShape(
			new this.Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5),
		);

		const mass = 0;
		colShape.calculateLocalInertia(mass);

		const rbInfo = new this.Ammo.btRigidBodyConstructionInfo(
			mass,
			motionState,
			colShape,
		);

		const body = new this.Ammo.btRigidBody(rbInfo);
		this._physicsWorld.addRigidBody(body);
	}

	_createBox() {
		const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
		const boxMaterial = new THREE.MeshNormalMaterial();
		const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
		boxMesh.position.y = 10;
		this._scene.add(boxMesh);

		const transform = new this.Ammo.btTransform();
		const quaternion = { x: 0, y: 0, z: 0, w: 1 };

		transform.setIdentity();
		transform.setOrigin(new this.Ammo.btVector3(0, 10, 0));
		transform.setRotation(
			new this.Ammo.btQuaternion(
				quaternion.x,
				quaternion.y,
				quaternion.z,
				quaternion.w,
			),
		);

		const motionState = new this.Ammo.btDefaultMotionState(transform);
		const colShape = new this.Ammo.btBoxShape(new this.Ammo.btVector3(2, 2, 2));

		const mass = 5;

		colShape.calculateLocalInertia(mass);

		const rbInfo = new this.Ammo.btRigidBodyConstructionInfo(
			mass,
			motionState,
			colShape,
		);

		const body = new this.Ammo.btRigidBody(rbInfo);
		this._physicsWorld.addRigidBody(body);

		boxMesh.physicsBody = body;
	}

	update() {
		const deltaTime = new THREE.Clock().getDelta();

		if (this._physicsWorld) {
			this._physicsWorld.stepSimulation(deltaTime);

			this._scene.traverse(obj3d => {
				if (obj3d instanceof THREE.Mesh) {
					const objThree = obj3d;
					const objAmmo = objThree.physicsBody;
					if (objAmmo) {
						const motionState = objAmmo.getMotionState();
						if (motionState) {
							let tmpTrans = this._tmpTrans;
							if (tmpTrans === undefined) {
								tmpTrans = new this.Ammo.btTransform();
								this._tmpTrans = tmpTrans;
							}
							motionState.getWorldTransform(tmpTrans);

							const pos = tmpTrans.getOrigin();
							const quat = tmpTrans.getRotation();

							objThree.position.set(pos.x(), pos.y(), pos.z());
							objThree.quaternion.set(quat.x(), quat.y(), quat.z(), quat.w());
						}
					}
				}
			});
		}
	}

	_setupModel() {
		this._createTable();
		this._createBox();
	}

	_setupCamera() {
		const camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			100,
		);

		camera.position.set(0, 20, 20);
		this._camera = camera;
	}

	_setupLight() {
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
		this._scene.add(ambientLight);

		const color = 0xffffff;
		const intensity = 0.9;
		const light = new THREE.DirectionalLight(color, intensity);
		light.position.set(-10, 15, 10);
		this._scene.add(light);

		light.castShadow = true;
		light.shadow.mapSize.width = 2048;
		light.shadow.mapSize.height = 2048;

		const d = 15;
		light.shadow.camera.left = -d;
		light.shadow.camera.right = d;
		light.shadow.camera.top = d;
		light.shadow.camera.bottom = -d;
	}

	render() {
		this._renderer.render(this._scene, this._camera);
		this.update();

		requestAnimationFrame(this.render.bind(this));
	}

	resize() {
		const width = this.target.clientWidth;
		const height = this.target.clientHeight;

		this._camera.aspect = width / height;
		this._camera.updateProjectionMatrix();

		this._renderer.setSize(width, height);
	}
}

export default Basic;
