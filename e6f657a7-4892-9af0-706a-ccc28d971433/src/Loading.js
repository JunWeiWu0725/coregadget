import React from 'react';
import { TbLoader2 } from "react-icons/tb";
function Loading() {

  return (
    <div className="loading-screen">
      <TbLoader2 size={50} className="rotating-icon" />
    </div>
  );
}

export default Loading;