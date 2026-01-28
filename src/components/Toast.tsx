import React from "react";
import styled, { keyframes, css } from "styled-components";
import { ThemedStyles } from "../types";
import useToast from "../hooks/useToast";

// Slide-down animation (only for showing)
const slideDown = keyframes`
	from {
		opacity: 0;
		transform: translate(-50%, -32px);
	}
	to {
		opacity: 1;
		transform: translate(-50%, 0);
	}
`;

const ToastContainer = styled.div<{ $visible: boolean } & ThemedStyles>`
	position: fixed;
	top: 7rem;
	left: 50%;
	z-index: 9999;
	background: ${({ theme }) => theme.secondary};
	color: ${({ theme }) => theme.white};
	padding: 1rem 2rem;
	border-radius: 1rem;
	box-shadow: ${({ theme }) => theme.shadows[4]};
	font-size: 1.5rem;
	font-family: ${({ theme }) => theme.fontFamily};
	display: flex;
    gap: 1rem;
	align-items: center;
	pointer-events: auto;
	opacity: ${({ $visible }) => ($visible ? 1 : 0)};
	transform: translateX(-50%);
	${({ $visible }) =>
		$visible &&
		css`
			animation: ${slideDown} 0.4s cubic-bezier(0.23, 1, 0.32, 1);
		`}
`;

const CloseButton = styled.button<ThemedStyles>`
	background: transparent;
	border: none;
	color: ${({ theme }) => theme.white};
	font-size: 1.5em;
	cursor: pointer;
	padding: 0;
	line-height: 1;
	opacity: 0.7;
	transition: opacity 0.2s;
	pointer-events: auto;
	&:hover {
		opacity: 1;
	}
`;


const Toast: React.FC = () => {
	const { visible, message, closeToast } = useToast();
	return (
		<ToastContainer $visible={visible} role="alert" aria-live="assertive">
			<span style={{ flex: 1 }}>{message}</span>
			<CloseButton aria-label="Close" onClick={closeToast}>
				×
			</CloseButton>
		</ToastContainer>
	);
};

export default Toast;
