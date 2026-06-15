import React from "react";
import { C } from "../../theme";

export const EthnicBorder = ({color=C.primary, height=3}) => (
  <div style={{width:"100%",height,background:`repeating-linear-gradient(90deg, ${color} 0px, ${color} 8px, transparent 8px, transparent 12px, ${color}80 12px, ${color}80 16px, transparent 16px, transparent 24px)`,opacity:0.6,borderRadius:1}}/>
);

export const EthnicCorner = ({size=20,color=C.primary,position="topLeft"}) => {
  const s = {position:"absolute",width:size,height:size,opacity:0.25};
  const pos = position==="topLeft"?{top:-1,left:-1}:position==="topRight"?{top:-1,right:-1}:position==="bottomLeft"?{bottom:-1,left:-1}:{bottom:-1,right:-1};
  const rotate = position==="topLeft"?"0":position==="topRight"?"90":position==="bottomLeft"?"270":"180";
  return(
    <svg style={{...s,...pos,transform:`rotate(${rotate}deg)`}} viewBox="0 0 20 20" fill="none">
      <path d="M0 0h20v2H2v18H0V0z" fill={color}/>
      <path d="M4 4h4v2H6v2H4V4z" fill={color}/>
    </svg>
  );
};
