import { VerificationLevel, IDKitWidget, useIDKit } from '@worldcoin/idkit';
import type { ISuccessResult } from '@worldcoin/idkit';
import { useEffect } from 'react';

export default function Home() {
	if (!process.env.NEXT_PUBLIC_WLD_APP_ID) {
		throw new Error('app_id is not set in environment variables!');
	}
	if (!process.env.NEXT_PUBLIC_WLD_ACTION) {
		throw new Error('app_id is not set in environment variables!');
	}

	const idKit = useIDKit();
	const onSuccess = (result: ISuccessResult) => {
		window.alert(
			'Successfully verified with World ID! Your nullifier hash is: ' +
				result.nullifier_hash,
		);
	};

	useEffect(() => {
		idKit.setOpen(true);
	}, []);

	const handleProof = async (result: ISuccessResult) => {
		console.log('Proof received from IDKit:\n', JSON.stringify(result)); // Log the proof from IDKit to the console for visibility
		const reqBody = {
			merkle_root: result.merkle_root,
			nullifier_hash: result.nullifier_hash,
			proof: result.proof,
			verification_level: result.verification_level,
			action: process.env.NEXT_PUBLIC_WLD_ACTION,
			signal: '',
		};
		console.log(reqBody);
	};

	return (
		<div>
			<div className="flex flex-col items-center justify-center align-middle h-screen">
				<IDKitWidget
					autoClose={true}
					action={process.env.NEXT_PUBLIC_WLD_ACTION!}
					app_id={
						process.env.NEXT_PUBLIC_WLD_APP_ID as `app_${string}`
					}
					onSuccess={onSuccess}
					handleVerify={handleProof}
					verification_level={VerificationLevel.Device}
				></IDKitWidget>
			</div>
		</div>
	);
}
