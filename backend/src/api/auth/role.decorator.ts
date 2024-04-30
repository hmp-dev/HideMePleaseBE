import { CustomDecorator, SetMetadata } from '@nestjs/common';

import { AllRoles } from '@/api/auth/auth.types';

export function SetAccessRoles(
	roleOrRoles: AllRoles[] | AllRoles,
): CustomDecorator {
	return SetMetadata(
		'roles',
		Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles],
	);
}
