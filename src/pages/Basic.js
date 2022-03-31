import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import * as AMMO from 'Ammo.js';

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
			physicsWorld.setGravity(new Ammo.btVector3(0, -9.807, 0)); // x,y,z y축에 중력의 가속도 값인 -9.807

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

		// 그림자를 받아 표현하기
		table.receiveShadow = true;
		this._scene.add(table);
	}

	_createDomino() {
		// 도미노의 나선형 경로 포인트
		const controlPoints = [
			[-10, 0, -10],
			[10, 0, -10],
			[10, 0, 10],
			[-10, 0, 10],
			[-10, 0, -8],
			[8, 0, -8],
			[8, 0, 8],
			[-8, 0, 8],
			[-8, 0, -6],
			[6, 0, -6],
			[6, 0, 6],
			[-6, 0, 6],
			[-6, 0, -4],
			[4, 0, -4],
			[4, 0, 4],
			[-4, 0, 4],
			[-4, 0, -2],
			[2, 0, -2],
			[2, 0, 2],
			[-2, 0, 2],
			[-2, 0, 0],
			[0, 0, 0],
		];

		const p0 = new THREE.Vector3();
		const p1 = new THREE.Vector3();
		const curve = new THREE.CatmullRomCurve3(
			controlPoints
				.map((p, ndx) => {
					if (ndx === controlPoints.length - 1) return p0.set(...p);
					p0.set(...p);
					p1.set(...controlPoints[(ndx + 1) % controlPoints.length]);
					return [
						new THREE.Vector3().copy(p0),
						new THREE.Vector3().lerpVectors(p0, p1, 0.3),
						new THREE.Vector3().lerpVectors(p0, p1, 0.7),
					];
				})
				.flat(),
			false,
		);

		const points = curve.getPoints(1000);
		const geometry = new THREE.BufferGeometry().setFromPoints(points);
		const material = new THREE.LineBasicMaterial({ color: 0xffff00 });
		const curveObject = new THREE.Line(geometry, material);

		this._scene.add(curveObject);

		// 도미노 한개의 크기
		const scale = { x: 0.75, y: 1, z: 0.1 };

		const dominoGeometry = new THREE.BoxGeometry();
		const dominoMaterial = new THREE.MeshNormalMaterial();

		const step = 0.0001;
		let length = 0.0;
		for (let t = 0; t < 1.0; t += step) {
			// 커브 상의 위치는 getPoint메서드를 통해 얻어오며,
			// 인자는 0 ~ 1의 값을 가진다
			// 0은 커브의 시작점
			// 0.5는 커브의 중간
			// 1은 커브의 마지막점
			const pt1 = curve.getPoint(t); // 커브의 t에 대한 위치
			const pt2 = curve.getPoint(t + step); // pt1 다음 위치

			length += pt1.distanceTo(pt2); // pt1과 pt2 사이의 누적거리

			// 누적거리가 0.4 이상일 때 장면에 추가한다.
			if (length > 0.4) {
				const domino = new THREE.Mesh(dominoGeometry, dominoMaterial);
				domino.position.copy(pt1);
				domino.scale.set(scale.x, scale.y, scale.z);
				domino.lookAt(pt2);

				domino.castShadow = true;
				domino.receiveShadow = true;
				this._scene.add(domino);

				length = 0.0;
			}
		}
	}

	_setupModel() {
		this._createTable();
		this._createDomino();
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
