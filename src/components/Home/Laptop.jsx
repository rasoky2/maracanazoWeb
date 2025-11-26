import React from 'react';

const Laptop = () => {
	return (
		<div
			className="laptop_container"
			style={{
				willChange: 'transform',
				transform:
					'translate3d(0vw, 0px, 0px) scale3d(1.01586, 1.01586, 1) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skew(0deg, 0deg)',
				transformStyle: 'preserve-3d'
			}}
		/>
	);
};

export default Laptop;