import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStatusVariant(status: 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Active' | 'Expired' | 'Terminated' | 'Pending' | 'In Progress' | 'Completed') {
    switch (status) {
        case 'Approved':
        case 'Active':
        case 'Completed':
            return 'default';
        case 'Under Review':
        case 'In Progress':
            return 'secondary';
        case 'Rejected':
        case 'Expired':
        case 'Terminated':
            return 'destructive';
        case 'Submitted':
        case 'Pending':
        default:
            return 'outline';
    }
}
