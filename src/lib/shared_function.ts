import { UserNameDetails } from "./user-data.model";


export function formatUserDisplayName(user: UserNameDetails): string {
    const lgFirstName = user.legal_first_name || '';
    const lgMiddleName = user.legal_middle_name || '';
    const lgLastName = user.legal_last_name || '';
    const pfrFirstName = user.preferred_first_name || '';
    const cstName = user.customized_display_name || '';
    switch (user.name_display_mode) {
      case 1:
        return `${lgFirstName} ${lgMiddleName} ${lgLastName}`.trim();
      case 2:
        return `${lgLastName} ${lgMiddleName} ${lgFirstName}`.trim();
      case 3:
        return `${pfrFirstName} ${lgMiddleName} ${lgLastName}`.trim();
      case 4:
        return `${lgLastName} ${lgMiddleName} ${pfrFirstName}`.trim();
      case 5:
        return `${cstName}`.trim();
      default:
        return '';
    }
  }