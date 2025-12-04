import pypm

pypm.Initialize()

for i in range(pypm.CountDevices()):
    info = pypm.GetDeviceInfo(i)
    print(i, info)

pypm.Terminate()