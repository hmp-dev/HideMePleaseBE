'use client';
import { VerificationLevel, IDKitWidget, useIDKit } from '@worldcoin/idkit';
import type { ISuccessResult } from '@worldcoin/idkit';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function Home() {
	if (!process.env.NEXT_PUBLIC_WLD_APP_ID) {
		throw new Error('app_id is not set in environment variables!');
	}
	if (!process.env.NEXT_PUBLIC_WLD_ACTION) {
		throw new Error('app_id is not set in environment variables!');
	}
	const searchParams = useSearchParams();
	const appVerifierId = searchParams.get('appVerifierId');

	const idKit = useIDKit();

	useEffect(() => {
		idKit.setOpen(true);
	}, []);

	const handleProof = async (result: ISuccessResult) => {
		const reqBody = {
			merkleRoot: result.merkle_root,
			nullifierHash: result.nullifier_hash,
			proof: result.proof,
			verificationLevel: result.verification_level,
			action: process.env.NEXT_PUBLIC_WLD_ACTION!,
			appVerifierId,
		};
		await fetch(
			`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/v1/auth/wld/login`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(reqBody),
			},
		);
		console.log('closing window');

		window.close();
	};

	return (
		<div className="flex flex-col items-center justify-center align-middle h-screen">
			<IDKitWidget
				autoClose={true}
				action={process.env.NEXT_PUBLIC_WLD_ACTION!}
				app_id={process.env.NEXT_PUBLIC_WLD_APP_ID as `app_${string}`}
				onSuccess={() => {}}
				handleVerify={handleProof}
				verification_level={VerificationLevel.Device}
				onError={() => window.close()}
			></IDKitWidget>
			<button
				className="text-2xl font-medium"
				onClick={() => window.close()}
			>
				Close
			</button>
		</div>
	);
}
