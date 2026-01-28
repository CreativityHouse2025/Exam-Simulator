import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Close } from '@styled-icons/material/Close';
import styled from 'styled-components';
import { hasInvalidNameChars, isEmail } from '../utils/format';
import { AccountForm, ThemedStyles } from '../types';
import useSettings from '../hooks/useSettings';
import { translate } from '../utils/translation';

const Overlay = styled.div<{ $visible: boolean }>`
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};
  background: ${({ $visible }) => ($visible ? 'rgba(0,0,0,0.3)' : 'transparent')};
  backdrop-filter: ${({ $visible }) => ($visible ? 'blur(6px)' : 'none')};
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.25s, backdrop-filter 0.25s, background 0.25s;
`;

const FormContainer = styled.form<{ $visible: boolean } & ThemedStyles>`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  background: ${({ theme }) => theme.white || '#fff'};
  padding: 2rem 3rem;
  border-radius: 16px;
  box-shadow: ${({ theme }) => theme.shadows[4] || '0 8px 24px rgba(0,0,0,0.2)'};
  max-width: 420px;
  width: 95%;
  z-index: 1010;
  font-family: ${({ theme }) => theme.fontFamily || "'Open Sans', sans-serif"};
  position: relative;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transform: translateY(${({ $visible }) => ($visible ? '0' : '20px')});
  transition: opacity 0.25s, transform 0.25s;
`;

const FormHeader = styled.div<ThemedStyles>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const CloseButton = styled.button<ThemedStyles>`
  color: ${({ theme }) => theme.grey[5] || '#333'};
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.2rem;
  transition: color 0.1s ease;
  &:hover {
    color: ${({ theme }) => theme.grey[7]};
  }
`;

const Title = styled.h2<ThemedStyles>`
  font-size: 2rem;
  padding: 0;
  margin: 0;
  font-weight: 700;
  color: ${({ theme }) => theme.black};
  text-align: center;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label<{ $align: string } & ThemedStyles>`
  font-size: 1.6rem;
  font-weight: 600;
  color: ${({ theme }) => theme.black};
  margin-bottom: 0.5rem;
  text-align: ${({ $align }) => $align};
`;

const Input = styled.input<ThemedStyles>`
  padding: 1rem 1rem;
  border: 1px solid ${({ theme }) => theme.grey[3] || '#ccc'};
  border-radius: 10px;
  font-size: 1.3rem;
  font-family: ${({ theme }) => theme.fontFamily || "'Open Sans', sans-serif"};
  outline: none;
  transition: all 0.2s;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
  &:focus {
    border-color: ${({ theme }) => theme.primary};
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15);
  }
  &:hover {
    border-color: ${({ theme }) => theme.primary};
  }
`;

const Error = styled.div<ThemedStyles>`
  color: ${({ theme }) => theme.incorrect || '#F44336'};
  font-size: 1.1rem;
  margin-top: -1rem;
  margin-bottom: 0.5rem;
`;

const Button = styled.button<ThemedStyles>`
  background: ${({ theme }) => theme.primary || '#0070f3'};
  color: ${({ theme }) => theme.white || '#fff'};
  border: none;
  padding: 1.1rem 2.2rem;
  font-size: 1.35rem;
  font-weight: 700;
  font-family: ${({ theme }) => theme.fontFamily || "'Open Sans', sans-serif"};
  border-radius: calc(${({ theme }) => theme.borderRadius} + 0.5rem);
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: ${({ theme }) => theme.secondary || '#005bb5'};
  }
  &:active {
    transform: translateY(1px);
  }
`;

type UserInfoFormProps = {
	onSubmit: (fullName: string, email: string) => void
	visible: boolean
	onClose: () => void
	initialValues: AccountForm
}

const UserInfoForm: React.FC<UserInfoFormProps> = ({ initialValues, onSubmit, onClose, visible }) => {
	const [form, setForm] = useState<AccountForm>(initialValues);
	const [error, setError] = useState<string>('');
	const formRef = useRef<HTMLFormElement | null>(null);

	useEffect(() => {
		// keep form state up to date with props
		setForm(initialValues)
	}, [initialValues])

	const { settings } = useSettings();
	const langCode = settings.language;

	const labelAlignment = langCode === "en" ? "left" : "right"

	const translations = React.useMemo(() => (
		{
			title: translate('form.user-info.title'),
			submit: translate('form.user-info.submit'),
			fullNameLabel: translate('form.user-info.full-name.label'),
			fullNamePlaceholder: translate('form.user-info.full-name.placeholder'),
			emailLabel: translate('form.user-info.email.label'),
			emailPlaceholder: translate('form.user-info.email.placeholder'),
			invalidEmail: translate('form.user-info.email.invalid'),
			invalidName: translate('form.user-info.full-name.invalid'),
			missingName: translate('form.user-info.full-name.missingName'),
		}
	), [langCode])
	
	const handleClose = useCallback(() => {
		onClose();		
		setError('')
		setForm(initialValues);		
	}, [onClose, initialValues])


	useEffect(() => {
		if (!handleClose) return;
		const handler = (event: MouseEvent | TouchEvent) => {
			const target = event.target as Node;
			if (formRef.current && !formRef.current.contains(target)) {
				handleClose();
			}
		};
		document.addEventListener('mousedown', handler);
		document.addEventListener('touchstart', handler);
		return () => {
			document.removeEventListener('mousedown', handler);
			document.removeEventListener('touchstart', handler);
		};
	}, [handleClose]);


	const handleChange = React.useCallback((
		e: React.ChangeEvent<HTMLInputElement>
	) => {

		const { name, value } = e.target;

		setForm(prev => ({
			...prev,
			[name]: value,
		}));
	}, [])

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.fullName.trim()) {
			setError(translations.missingName);
			return;
		}
		if (hasInvalidNameChars(form.fullName)) {
			setError(translations.invalidName);
			return;
		}
		if (!isEmail(form.email)) {
			setError(translations.invalidEmail);
			return;
		}
		onSubmit(form.fullName.trim(), form.email.trim());
		onClose();
		setError('');
	};


	return (
		<Overlay $visible={visible}>
			<FormContainer ref={formRef} onSubmit={handleSubmit} noValidate $visible={visible}>
				<FormHeader>
					<Title>{translations.title}</Title>
					<CloseButton type="button" aria-label="Close" onClick={handleClose}>
						<Close size={24} />
					</CloseButton>
				</FormHeader>
				<FieldGroup>
					<Label $align={labelAlignment} htmlFor="fullName">{translations.fullNameLabel}</Label>
					<Input
						id="fullName"
						type="text"
						name="fullName"
						value={form.fullName}
						onChange={handleChange}
						placeholder={translations.fullNamePlaceholder}
						autoComplete="name"
					/>
				</FieldGroup>
				<FieldGroup>
					<Label $align={labelAlignment} htmlFor="email">{translations.emailLabel}</Label>
					<Input
						id="email"
						type="email"
						name="email"
						value={form.email}
						onChange={handleChange}
						placeholder={translations.emailPlaceholder}
						autoComplete="email"
					/>
				</FieldGroup>
				{error && <Error>{error}</Error>}
				<Button type="submit">{translations.submit}</Button>
			</FormContainer>
		</Overlay>
	);
};

export default React.memo(UserInfoForm);
