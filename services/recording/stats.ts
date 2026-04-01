import type { recordGetDiskStatus } from '@shared/schema/record';
import { statfs } from 'fs/promises';

const LOW_DISK_PERCENT = 20;
const CRITICAL_DISK_SPACE_KB = 65536; // 64MB
const MINIMUM_DISK_SPACE_KB = 1024576; // 1GB

export async function getRecordingDiskSpace(): Promise<number | null> {
	try {
		if (!Bun.env.RECORD_PATH) {
			return null;
		}

		const stats = await statfs(Bun.env.RECORD_PATH, { bigint: true });
		return Number(stats.bavail * stats.bsize) / 1024;
	} catch {
		console.error(
			`[Recording Stats][getRecordingDiskSpace] Invalid folder or disk.`
		);
		return null;
	}
}

export async function getRecordingDiskSize(): Promise<number | null> {
	try {
		if (!Bun.env.RECORD_PATH) {
			return null;
		}
		const stats = await statfs(Bun.env.RECORD_PATH, { bigint: true });
		return Number(stats.blocks * stats.bsize) / 1024;
	} catch {
		console.error(
			`[Recording Stats][getRecordingDiskSize] Invalid folder or disk.`
		);
		return null;
	}
}

export async function isRecordingDiskFull(): Promise<boolean> {
	const diskSpace = await getRecordingDiskSpace();

	return diskSpace === null || isNaN(diskSpace) || diskSpace <= 0;
}

export async function getReadableRecordingDiskSpace(): Promise<string> {
	const diskSpace = await getRecordingDiskSpace();

	return diskSpace === null || isNaN(diskSpace) || diskSpace < 0
		? 'Invalid'
		: (diskSpace / 1024 / 1024).toFixed(2).toString() + `GB`;
}

export async function getRecordingDiskStatus(): Promise<recordGetDiskStatus> {
	const diskSpace = await getRecordingDiskSpace();
	const diskSize = await getRecordingDiskSize();

	if (diskSpace === null || isNaN(diskSpace) || diskSpace < 0) {
		return 'error';
	}

	if (diskSize === null || isNaN(diskSize) || diskSize < 0) {
		return 'error';
	}

	if (diskSize <= MINIMUM_DISK_SPACE_KB) {
		return 'insufficient_min_size';
	}

	const diskSpacePercent = (diskSpace / diskSize) * 100;
	const critialLowDiskSpacePercent = (CRITICAL_DISK_SPACE_KB / diskSize) * 100;

	if (diskSpacePercent > LOW_DISK_PERCENT) {
		return 'ok';
	} else if (
		diskSpacePercent > critialLowDiskSpacePercent &&
		diskSpacePercent <= LOW_DISK_PERCENT
	) {
		return 'low_space';
	} else if (
		diskSpacePercent > 0 &&
		diskSpacePercent <= critialLowDiskSpacePercent
	) {
		return 'critical_low_space';
	} else {
		return 'full';
	}
}
