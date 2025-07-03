const THREE = window.MINDAR.IMAGE.THREE;

document.addEventListener('DOMContentLoaded', () => {
  const start = async() => {
    const mindarThree = new window.MINDAR.IMAGE.MindARThree({
      container: document.body,
      imageTargetSrc: '/static/assets/targets/card.mind',
    });
    const {renderer, scene, camera} = mindarThree;

    const light = new THREE.HemisphereLight( 0xffffff, 0xbbbbff, 1 );
    scene.add(light);

    const boxGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const sphereGeometry = new THREE.SphereGeometry(0.05, 32, 16);
    const cylinderGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.1, 32);

    const material = new THREE.MeshStandardMaterial({color: 0xff0000});

    const boxMesh = new THREE.Mesh(boxGeometry, material);
    const sphereMesh = new THREE.Mesh(sphereGeometry, material);
    const cylinderMesh = new THREE.Mesh(cylinderGeometry, material);

    const anchor = mindarThree.addAnchor(0);
    anchor.group.add(boxMesh);
    anchor.group.add(sphereMesh);
    anchor.group.add(cylinderMesh);

    await mindarThree.start();
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });
  }
  start();
});
