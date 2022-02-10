type Resolve<T> = (value: T | PromiseLike<T>) => void;
type Reject = (reason?: any) => void;

export class DeferredPromise<T> {
	readonly promise: Promise<T>;
	readonly resolve: Resolve<T>;
	readonly reject: Reject;

	constructor() {
		let resolve: Resolve<T>;
		let reject: Reject;
		this.promise = new Promise((res, rej) => {
			resolve = res;
			reject = rej;
		});

		this.resolve = resolve!;
		this.reject = reject!;
	}
}
